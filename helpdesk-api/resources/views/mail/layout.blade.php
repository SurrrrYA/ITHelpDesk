<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
</head>
<body style="margin:0;padding:24px;background:#fafafa;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid #e4e4e7;">
            <span style="display:inline-block;background:#2563eb;color:#ffffff;font-size:12px;font-weight:bold;padding:6px 10px;border-radius:8px;">
                IT Helpdesk
            </span>
        </div>

        <div style="padding:24px;">
            <h1 style="margin:0 0 12px;font-size:18px;line-height:1.4;">@yield('heading')</h1>
            @yield('content')
        </div>

        <div style="padding:16px 24px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
            Email otomatis dari IT Helpdesk. Jangan balas email ini.
        </div>
    </div>
</body>
</html>
