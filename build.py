"""把 src/ 下的样式、页面结构和脚本拼成一个可以直接打开的 index.html。"""
import glob
import os

root = os.path.dirname(os.path.abspath(__file__))
read = lambda p: open(os.path.join(root, p), encoding='utf-8').read()

head = read('src/head.html')
body = read('src/body.html')
js = []
for f in sorted(glob.glob(os.path.join(root, 'src/js/*.js'))):
    js.append('/* ---- %s ---- */\n' % os.path.basename(f) + open(f, encoding='utf-8').read())

page = (
    '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + '\n</head>\n<body>\n' + body + '\n<script>\n' + '\n'.join(js) + '\n</script>\n</body>\n</html>\n'
)
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(page)
print('built index.html', len(page), 'bytes')
