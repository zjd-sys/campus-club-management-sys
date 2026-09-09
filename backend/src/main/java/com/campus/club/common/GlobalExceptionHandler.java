package com.campus.club.common;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public R<Void> handleBiz(BizException e) {
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValid(MethodArgumentNotValidException e) {
        StringBuilder sb = new StringBuilder();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            sb.append(fe.getField()).append(":").append(fe.getDefaultMessage()).append("; ");
        }
        return R.fail(sb.toString().trim());
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public R<Void> handleAuth(AuthenticationException e) {
        return R.fail(401, e.getMessage() == null ? "未登录或登录已过期" : e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleOther(HttpServletRequest req, Exception e) {
        // 严禁在日志中打印用户密码等敏感信息
        return R.fail(500, "服务器内部错误：" + e.getMessage());
    }
}
