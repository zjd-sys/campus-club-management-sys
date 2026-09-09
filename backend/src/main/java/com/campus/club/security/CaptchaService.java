package com.campus.club.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.club.entity.Captcha;
import com.campus.club.mapper.CaptchaMapper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Random;
import java.util.UUID;
import javax.imageio.ImageIO;

/** 动态图形验证码：后端生成图片 + 明文入库（前端只拿图片），2分钟有效，单次使用 */
@Service
public class CaptchaService {

    private final CaptchaMapper captchaMapper;
    private final Random random = new Random();

    public CaptchaService(CaptchaMapper captchaMapper) {
        this.captchaMapper = captchaMapper;
    }

    @PostConstruct
    public void init() {
        // 启动清理一次过期验证码
    }

    public CaptchaDto generate() {
        String captchaId = UUID.randomUUID().toString().replace("-", "");
        String code = randomCode(4);
        LocalDateTime now = LocalDateTime.now();
        Captcha c = new Captcha();
        c.setCaptchaId(captchaId);
        c.setCode(code);
        c.setCreateTime(now);
        c.setExpireTime(now.plusMinutes(2));
        c.setDeleted(0);
        captchaMapper.insert(c);

        String base64 = render(code);
        return new CaptchaDto(captchaId, base64);
    }

    /** 校验并立即作废（单次有效） */
    public boolean validate(String captchaId, String code) {
        if (captchaId == null || code == null) return false;
        Captcha c = captchaMapper.selectOne(new LambdaQueryWrapper<Captcha>()
                .eq(Captcha::getCaptchaId, captchaId).eq(Captcha::getDeleted, 0));
        if (c == null) return false;
        boolean ok = !LocalDateTime.now().isAfter(c.getExpireTime())
                && c.getCode().equalsIgnoreCase(code.trim());
        // 无论成功失败，校验一次即作废
        captchaMapper.deleteById(c.getId());
        return ok;
    }

    private String randomCode(int len) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去除易混淆字符
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }

    private String render(String code) {
        int w = 110, h = 40;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(245, 247, 250));
        g.fillRect(0, 0, w, h);
        g.setFont(new Font("Arial", Font.BOLD, 26));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color(64 + random.nextInt(120), 96 + random.nextInt(120), 64 + random.nextInt(120)));
            g.drawString(String.valueOf(code.charAt(i)), 18 + i * 22, 30);
        }
        // 干扰线
        g.setColor(new Color(200, 200, 200));
        for (int i = 0; i < 4; i++) {
            g.drawLine(random.nextInt(w), random.nextInt(h), random.nextInt(w), random.nextInt(h));
        }
        g.dispose();
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", os);
            return Base64.getEncoder().encodeToString(os.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("验证码生成失败", e);
        }
    }

    public record CaptchaDto(String captchaId, String imageBase64) {
    }
}
