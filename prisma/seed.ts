import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@vietnamese.ai';
const DEMO_PASSWORD = 'demo123456';
const DEMO_NAME = 'Admin Demo';

async function main(): Promise<void> {
  console.log('🌱 Seeding demo data...');

  // Xóa data cũ của demo user (idempotent)
  const existingUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existingUser) {
    const accounts = await prisma.facebookAccount.findMany({
      where: { userId: existingUser.id },
      select: { id: true },
    });
    for (const a of accounts) {
      const convs = await prisma.conversation.findMany({
        where: { accountId: a.id },
        select: { id: true },
      });
      for (const c of convs) {
        await prisma.aiResponse.deleteMany({
          where: { message: { conversationId: c.id } },
        });
        await prisma.message.deleteMany({ where: { conversationId: c.id } });
      }
      await prisma.conversation.deleteMany({ where: { accountId: a.id } });
    }
    await prisma.facebookAccount.deleteMany({ where: { userId: existingUser.id } });
    await prisma.knowledgeItem.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // Tạo user demo
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash },
  });
  console.log(`  ✓ User: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // ── Knowledge items ──
  const knowledgeSeed = [
    {
      title: 'Bảng giá dịch vụ',
      content: 'Gói cơ bản: 100.000đ/tháng. Gói nâng cao: 500.000đ/tháng. Gói doanh nghiệp: 2.000.000đ/tháng. Giá đã bao gồm VAT.',
      category: 'pricing',
      tags: ['giá', 'bảng giá', 'thanh toán'],
    },
    {
      title: 'Chính sách đổi trả',
      content: 'Quý khách có thể đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Hàng trả phải còn nguyên tem, nhãn và chưa qua sử dụng.',
      category: 'policy',
      tags: ['đổi trả', 'chính sách', 'bảo hành'],
    },
    {
      title: 'Hướng dẫn đặt hàng',
      content: 'Bước 1: Chọn sản phẩm. Bước 2: Thêm vào giỏ hàng. Bước 3: Điền thông tin giao hàng. Bước 4: Chọn phương thức thanh toán. Bước 5: Xác nhận đơn.',
      category: 'faq',
      tags: ['đặt hàng', 'hướng dẫn'],
    },
    {
      title: 'Thông tin liên hệ',
      content: 'Hotline: 1900-1234. Email: support@vietnamese.ai. Giờ làm việc: 8:00 - 22:00 hàng ngày, bao gồm cả thứ 7 và Chủ nhật.',
      category: 'faq',
      tags: ['hotline', 'liên hệ', 'support'],
    },
    {
      title: 'Phương thức thanh toán',
      content: 'Chấp nhận thẻ ngân hàng (Visa/Mastercard), ví điện tử (MoMo, ZaloPay), chuyển khoản ngân hàng và thanh toán khi nhận hàng (COD).',
      category: 'pricing',
      tags: ['thanh toán', 'cod', 'momo'],
    },
  ];

  for (const k of knowledgeSeed) {
    await prisma.knowledgeItem.create({
      data: {
        userId: user.id,
        title: k.title,
        content: k.content,
        category: k.category,
        tags: JSON.stringify(k.tags),
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Knowledge: ${knowledgeSeed.length} items`);

  // ── Facebook accounts ──
  const accounts = [
    { name: 'Shop Online VN', fbId: 'fb_shop_001' },
    { name: 'Tech News & Reviews', fbId: 'fb_tech_002' },
    { name: 'Marketing Group VN', fbId: 'fb_mkt_003', inactive: true },
  ];

  const accountIds: string[] = [];
  for (const a of accounts) {
    const acc = await prisma.facebookAccount.create({
      data: {
        userId: user.id,
        facebookUserId: a.fbId,
        displayName: a.name,
        accessToken: `demo-token-${a.fbId}`,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: a.inactive ? 'disconnected' : 'active',
        lastSyncAt: new Date(),
      },
    });
    accountIds.push(acc.id);
  }
  console.log(`  ✓ Accounts: ${accountIds.length}`);

  // ── Conversations + messages + AI responses ──
  const conversations = [
    {
      accountIdx: 0,
      participantName: 'Nguyễn Văn A',
      participantFbId: 'cust_a',
      messages: [
        { dir: 'inbound', content: 'Xin chào shop, sản phẩm giá bao nhiêu?', class: 'pricing', sender: 'cust_a', offsetMin: 120 },
        { dir: 'outbound', content: 'Chào bạn! Gói cơ bản 100k/tháng, bạn tham khảo nhé ạ.', class: null, sender: 'fb_shop_001', offsetMin: 118 },
        { dir: 'inbound', content: 'Shop có giao nội thành không?', class: 'general', sender: 'cust_a', offsetMin: 100 },
        { dir: 'outbound', content: 'Có nhé, shop giao nội thành trong 2h ạ.', class: null, sender: 'fb_shop_001', offsetMin: 98 },
      ],
      aiPending: { content: 'Shop có freeship cho đơn trên 200k ạ.', confidence: 0.88 },
    },
    {
      accountIdx: 0,
      participantName: 'Trần Thị B',
      participantFbId: 'cust_b',
      messages: [
        { dir: 'inbound', content: 'Tôi muốn khiếu nại về đơn hàng #12345', class: 'complaint', sender: 'cust_b', offsetMin: 30 },
      ],
      aiPending: { content: 'Chúng tôi rất tiếc về trải nghiệm của bạn. Vui lòng cung cấp chi tiết để xử lý trong 24h.', confidence: 0.7 },
    },
    {
      accountIdx: 0,
      participantName: 'Lê Văn C',
      participantFbId: 'cust_c',
      messages: [
        { dir: 'inbound', content: 'Đơn hàng của tôi đang ở đâu?', class: 'support', sender: 'cust_c', offsetMin: 240 },
        { dir: 'outbound', content: 'Bạn vui lòng cung cấp mã đơn để shop kiểm tra ạ.', class: null, sender: 'fb_shop_001', offsetMin: 238 },
        { dir: 'inbound', content: 'Mã đơn #67890', class: 'support', sender: 'cust_c', offsetMin: 230 },
      ],
      aiPending: { content: 'Đơn hàng #67890 đang trên đường giao, dự kiến đến trong 1-2 ngày ạ.', confidence: 0.82 },
    },
    {
      accountIdx: 0,
      participantName: 'Phạm Thị D',
      participantFbId: 'cust_d',
      messages: [
        { dir: 'inbound', content: 'Phí vận chuyển bao nhiêu?', class: 'pricing', sender: 'cust_d', offsetMin: 200 },
        { dir: 'outbound', content: 'Phí ship nội thành 20k, ngoại thành 35-50k tùy khu vực ạ.', class: null, sender: 'fb_shop_001', offsetMin: 198 },
      ],
      aiSent: { content: 'Phí ship nội thành 20k, ngoại thành 35-50k ạ.', confidence: 0.91 },
    },
    {
      accountIdx: 0,
      participantName: 'Hoàng Văn E',
      participantFbId: 'cust_e',
      messages: [
        { dir: 'inbound', content: 'Sản phẩm X còn hàng không?', class: 'general', sender: 'cust_e', offsetMin: 150 },
        { dir: 'outbound', content: 'Sản phẩm X hiện còn hàng, bạn đặt ngay nhé ạ!', class: null, sender: 'fb_shop_001', offsetMin: 148 },
      ],
      aiSent: { content: 'Sản phẩm X hiện đang có sẵn hàng. Bạn có thể đặt hàng ngay.', confidence: 0.97 },
    },
    {
      accountIdx: 0,
      participantName: 'Đặng Thị F',
      participantFbId: 'cust_f',
      messages: [
        { dir: 'inbound', content: 'Cảm ơn shop, tôi đã nhận được hàng', class: 'general', sender: 'cust_f', offsetMin: 600 },
      ],
    },
    {
      accountIdx: 0,
      participantName: 'Mai Thị G',
      participantFbId: 'cust_g',
      messages: [
        { dir: 'inbound', content: 'Khi nào có hàng mới về?', class: 'general', sender: 'cust_g', offsetMin: 720 },
      ],
      aiRejected: { content: 'Shop sẽ nhập hàng mới vào tuần sau ạ.', confidence: 0.6 },
    },
  ];

  let convCount = 0;
  let msgCount = 0;
  let aiCount = 0;

  for (const c of conversations) {
    const conv = await prisma.conversation.create({
      data: {
        accountId: accountIds[c.accountIdx],
        facebookConversationId: `${accountIds[c.accountIdx]}_${c.participantFbId}`,
        participantName: c.participantName,
        participantFacebookId: c.participantFbId,
        status: 'active',
        autoReplyMode: 'automatic',
      },
    });
    convCount++;

    const lastInboundMsgIds: string[] = [];
    for (const m of c.messages) {
      const created = await prisma.message.create({
        data: {
          conversationId: conv.id,
          direction: m.dir,
          content: m.content,
          messageType: 'text',
          classification: m.class,
          senderId: m.sender,
          status: m.dir === 'outbound' ? 'sent' : 'received',
          sentAt: m.dir === 'outbound' ? new Date(Date.now() - m.offsetMin * 60 * 1000) : null,
          createdAt: new Date(Date.now() - m.offsetMin * 60 * 1000),
        },
      });
      msgCount++;
      if (m.dir === 'inbound') lastInboundMsgIds.push(created.id);
    }

    // AI responses
    const lastInbound = lastInboundMsgIds[lastInboundMsgIds.length - 1];
    if (lastInbound) {
      if (c.aiPending) {
        await prisma.aiResponse.create({
          data: {
            messageId: lastInbound,
            content: c.aiPending.content,
            confidence: c.aiPending.confidence,
            status: 'pending',
            createdAt: new Date(Date.now() - 60 * 1000),
          },
        });
        aiCount++;
      }
      if (c.aiSent) {
        await prisma.aiResponse.create({
          data: {
            messageId: lastInbound,
            content: c.aiSent.content,
            confidence: c.aiSent.confidence,
            status: 'sent',
            sentAt: new Date(Date.now() - 30 * 60 * 1000),
            createdAt: new Date(Date.now() - 35 * 60 * 1000),
          },
        });
        aiCount++;
      }
      if (c.aiRejected) {
        await prisma.aiResponse.create({
          data: {
            messageId: lastInbound,
            content: c.aiRejected.content,
            confidence: c.aiRejected.confidence,
            status: 'rejected',
            createdAt: new Date(Date.now() - 120 * 60 * 1000),
          },
        });
        aiCount++;
      }
    }
  }

  console.log(`  ✓ Conversations: ${convCount}, Messages: ${msgCount}, AI responses: ${aiCount}`);
  console.log('\n🎉 Seed hoàn thành!');
  console.log(`   Đăng nhập demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
