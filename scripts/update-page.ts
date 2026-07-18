import { prisma } from '../src/config/prisma.js';
import { encrypt } from '../src/utils/encryption.js';

async function updatePage() {
  // Xóa account cũ (user "Ba Danh" không phải Page thật)
  await prisma.facebookAccount.deleteMany({});
  console.log('Đã xóa account cũ');

  // Lấy user đầu tiên trong DB để gán Page
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('Không có user trong DB');
    process.exit(1);
  }

  // Tạo account mới với Page token đúng
  const account = await prisma.facebookAccount.create({
    data: {
      userId: user.id,
      facebookUserId: '1198955446627869', // Page "May Tinh Mui Ne"
      displayName: 'May Tinh Mui Ne',
      accessToken: encrypt('EAAszDc5xr08BR6sgRsQAbZAYY3vZCDZBdUTtf5Hd68rY1kCcYYktVEZCPcrsZBy27hFZBxFBjkg7qVHvQXxbstWGHZCweY8iVMw2WIRpwwm9kHZCEeJw4WjDJZASNZAglDmRxxcHvpYgGgsoNfunnl0ClBEA7OZBZAX2hJP78G6fcdyHUWE06caUZBOvbIOZA8YfzVpBHpV67F6LceXgZDZD'),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'active',
      lastSyncAt: new Date(),
    },
  });
  console.log('✅ Đã tạo account mới:');
  console.log('  Account ID:', account.id);
  console.log('  Page Name:', account.displayName);
  console.log('  Page FB ID:', account.facebookUserId);
  console.log('  User ID:', account.userId);

  await prisma.$disconnect();
}

updatePage().catch(console.error);
