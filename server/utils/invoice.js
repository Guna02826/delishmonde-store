import nodemailer from "nodemailer";

const formatMoney = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

const buildInvoiceHtml = (order) => {
  const rows = order.products
    .map((item) => {
      const product = item.productId;
      const itemTotal = product.price * item.quantity;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(product.price)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(itemTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 680px; margin: 0 auto;">
      <h2 style="color: #8b4513;">Delish Monde Invoice</h2>
      <p>Thank you for your order. Here is your invoice.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f7f1eb;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top: 20px; text-align: right;">
        <p><strong>Subtotal:</strong> ${formatMoney(order.subtotal)}</p>
        <p><strong>Discount:</strong> - ${formatMoney(order.discountAmount)}</p>
        ${order.couponCode ? `<p><strong>Coupon:</strong> ${order.couponCode}</p>` : ""}
        <h3>Total: ${formatMoney(order.totalPrice)}</h3>
      </div>
    </div>
  `;
};

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendInvoiceEmail = async ({ to, order }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Delish Monde invoice for order ${order._id}`,
    html: buildInvoiceHtml(order),
  });
};
