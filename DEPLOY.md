# Deploy Frontend — vitech-tuyen-dung (Next.js)

## Yêu cầu VPS

| Thông số | Tối thiểu |
|----------|-----------|
| OS | Ubuntu 22.04 LTS |
| RAM | 2 GB |
| CPU | 1 vCPU |
| Disk | 20 GB |
| Domain | Trỏ A record về IP VPS (ví dụ: `vitech.vn`) |

> Backend (vitech-api) phải được deploy và chạy trước. Xem [vitech-api/DEPLOY.md](../vitech-api/DEPLOY.md).

---

## 1. Cài đặt môi trường

SSH vào server và cập nhật hệ thống:
```bash
ssh root@<IP_VPS>
apt update && apt upgrade -y
```

### Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node --version   # v20.x.x
npm --version
```

### PM2 (quản lý process Next.js)
```bash
npm install -g pm2
pm2 startup systemd -u root --hp /root
```

### Nginx
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Certbot (SSL miễn phí)
```bash
apt install -y certbot python3-certbot-nginx
```

---

## 2. Upload source code

### Git clone (khuyến nghị)
```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPO_FE> vitech-tuyen-dung
```

### Hoặc SCP từ máy local
```bash
scp -r ./vitech-tuyen-dung root@<IP_VPS>:/var/www/vitech-tuyen-dung
```

---

## 3. Cấu hình biến môi trường

```bash
cd /var/www/vitech-tuyen-dung
```

Tạo file `.env.local`:
```bash
cat > .env.local << 'EOF'
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<PHẢI_GIỐNG_BACKEND>
ADMIN_SECRET=<CHUỖI_NGẪU_NHIÊN>
NESTJS_API_URL=http://localhost:3001/api
EOF
```

> `NESTJS_API_URL` dùng `localhost` vì FE và BE cùng trên 1 VPS, giao tiếp nội bộ không qua internet.
>
> `ADMIN_USERNAME` và `ADMIN_PASSWORD` phải khớp với giá trị trong `.env` của backend.

---

## 4. Cài dependencies và build

```bash
npm install
npm run build
```

Nếu build lỗi:
```bash
# Xem lỗi chi tiết
npm run build 2>&1 | tail -30

# Kiểm tra .env.local đã đủ biến chưa
cat .env.local
```

---

## 5. Chạy với PM2

```bash
pm2 start npm --name "vitech-fe" -- start
pm2 save

pm2 list
pm2 logs vitech-fe
```

Next.js chạy ở port **3000**.

---

## 6. Cấu hình Nginx

```bash
nano /etc/nginx/sites-available/vitech-fe
```

```nginx
server {
    listen 80;
    server_name <DOMAIN_FE>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt:
```bash
ln -s /etc/nginx/sites-available/vitech-fe /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 7. Cấp SSL (HTTPS)

```bash
certbot --nginx -d <DOMAIN_FE>
```

Kiểm tra tự động gia hạn:
```bash
certbot renew --dry-run
```

---

## 8. Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

> Không cần mở port 3000 ra ngoài — Nginx là gateway duy nhất.

---

## 9. Kiểm tra

```bash
pm2 list
curl -I https://<DOMAIN_FE>
```

---

## Cập nhật code

```bash
cd /var/www/vitech-tuyen-dung
git pull
npm install
npm run build
pm2 restart vitech-fe
```

---

## Biến môi trường — Tham chiếu đầy đủ

| Biến | Bắt buộc | Mô tả | Ví dụ |
|------|----------|-------|-------|
| `ADMIN_USERNAME` | Có | Phải giống backend | `admin` |
| `ADMIN_PASSWORD` | Có | Phải giống backend | `Vitech@2024!` |
| `ADMIN_SECRET` | Có | Secret tạo session cookie | _(random)_ |
| `NESTJS_API_URL` | Có | URL NestJS backend (nội bộ) | `http://localhost:3001/api` |

---

## Xử lý sự cố

### Nginx báo 502 Bad Gateway
```bash
pm2 list                          # kiểm tra Next.js
ss -tlnp | grep 3000              # kiểm tra port
pm2 restart vitech-fe
```

### Next.js không nhận biến môi trường mới
```bash
npm run build
pm2 restart vitech-fe
```

### Build lỗi TypeScript
```bash
# Kiểm tra .env.local đã đủ biến chưa
cat .env.local
npm run build 2>&1 | tail -30
```

### Xem log realtime
```bash
pm2 logs vitech-fe
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Monitoring với PM2

```bash
# Dashboard realtime (CPU, RAM, log)
pm2 monit

# Xem thông tin chi tiết
pm2 show vitech-fe

# Tự restart khi vượt quá 500MB RAM
pm2 start npm --name "vitech-fe" -- start --max-memory-restart 500M
pm2 save
```

---

## Checklist trước khi go-live

- [ ] Đã đổi `ADMIN_PASSWORD` khỏi giá trị mặc định `vitech2024`
- [ ] Đã tạo `ADMIN_SECRET` ngẫu nhiên (`openssl rand -base64 32`)
- [ ] `NESTJS_API_URL` trỏ đúng địa chỉ backend
- [ ] SSL đã hoạt động (`https://` xanh)
- [ ] Firewall UFW đã bật
- [ ] PM2 đã lưu config (`pm2 save`) và startup đã đăng ký
- [ ] Test đăng nhập admin thành công
- [ ] Test thêm/sửa/xóa tin tuyển dụng
- [ ] Test thêm/sửa/xóa tin tức
- [ ] Trang chủ hiển thị đúng dữ liệu từ DB
