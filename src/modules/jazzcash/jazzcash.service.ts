import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JazzcashService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private getSecureHash(data: Record<string, string>): string {
    const salt = this.config.get('JAZZCASH_INTEGRITY_SALT') || 'your_salt';
    const sorted = Object.keys(data)
      .sort()
      .map((k) => data[k])
      .join('&');
    return crypto
      .createHmac('sha256', salt)
      .update(sorted)
      .digest('hex')
      .toUpperCase();
  }

  async initiateDeposit(bookingId: string, customerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { milestones: { where: { name: 'Deposit' } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new NotFoundException();

    const deposit = booking.milestones[0];
    const amount = Math.round(Number(deposit.amount));
    const billRef = `LUMNI-${bookingId.slice(0, 8)}-${Date.now()}`;

    const paymentData = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: this.config.get('JAZZCASH_MERCHANT_ID') || 'MC00000',
      pp_SubMerchantID: '',
      pp_Password: this.config.get('JAZZCASH_PASSWORD') || 'password',
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: billRef,
      pp_Amount: String(amount * 100),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: this.formatDateTime(new Date()),
      pp_BillReference: billRef,
      pp_Description: `Lumni Solar Deposit - ${bookingId}`,
      pp_TxnExpiryDateTime: this.formatDateTime(
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      ),
      pp_ReturnURL: this.config.get('JAZZCASH_RETURN_URL') || 'http://localhost:3000',
      pp_SecureHash: '',
      ppmpf_1: customerId,
      ppmpf_2: bookingId,
    };

    paymentData.pp_SecureHash = this.getSecureHash(paymentData);

    const isSandbox = this.config.get('JAZZCASH_SANDBOX') === 'true';
    const gatewayUrl = isSandbox
      ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'
      : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';

    return {
      gatewayUrl,
      paymentData,
      amount,
      billReference: billRef,
      sandbox: isSandbox,
      message: isSandbox
        ? 'Sandbox mode: payment will be simulated via IPN endpoint'
        : 'Redirect customer to JazzCash gateway',
    };
  }

  async handleIpn(body: Record<string, string>) {
    const receivedHash = body.pp_SecureHash;
    const dataForHash = { ...body };
    delete dataForHash.pp_SecureHash;
    const computedHash = this.getSecureHash(dataForHash);

    const isValid = receivedHash === computedHash || this.config.get('JAZZCASH_SANDBOX') === 'true';
    if (!isValid) {
      return { success: false, message: 'Invalid signature' };
    }

    const bookingId = body.ppmpf_2;
    const responseCode = body.pp_ResponseCode;

    if (responseCode === '000' || this.config.get('JAZZCASH_SANDBOX') === 'true') {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { milestones: true },
      });
      if (booking) {
        const deposit = booking.milestones.find((m) => m.name === 'Deposit');
        if (deposit) {
          await this.prisma.paymentMilestone.update({
            where: { id: deposit.id },
            data: {
              status: 'held',
              paymentRef: body.pp_TxnRefNo || body.pp_BillReference,
            },
          });
        }
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'active', depositPaidAt: new Date() },
        });
        await this.prisma.customerRequest.update({
          where: { id: booking.requestId },
          data: { status: 'booked' },
        });
      }
      return { success: true, message: 'Payment confirmed' };
    }

    return { success: false, message: 'Payment failed', code: responseCode };
  }

  async simulatePayment(bookingId: string) {
    return this.handleIpn({
      pp_ResponseCode: '000',
      pp_TxnRefNo: `SIM-${Date.now()}`,
      pp_BillReference: `SIM-${bookingId}`,
      ppmpf_2: bookingId,
      pp_SecureHash: 'sandbox',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  }
}
