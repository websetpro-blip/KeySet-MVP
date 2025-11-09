import os, webview
os.chdir('webview_app/app/static/host')
webview.create_window('keyset','index.html')
webview.start(http_server=True)
