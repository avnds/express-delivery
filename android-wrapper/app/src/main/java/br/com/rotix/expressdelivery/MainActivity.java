package br.com.rotix.expressdelivery;
import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.view.ViewGroup;
import android.graphics.Color;
import android.content.res.Configuration;
import android.webkit.WebSettings;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.content.Intent;
import android.net.Uri;
import android.content.pm.PackageManager;
public class MainActivity extends Activity {
    private WebView web;
    private static final String BASE = "https://express-delivery-sigma.vercel.app";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        root.addView(web, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 35) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets safe = insets.getInsets(
                    WindowInsets.Type.statusBars() |
                    WindowInsets.Type.navigationBars() |
                    WindowInsets.Type.displayCutout());
                root.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return insets;
            });
            root.requestApplyInsets();
        }
        web.getSettings().setJavaScriptEnabled(true);
        if (Build.VERSION.SDK_INT >= 33) {
            web.getSettings().setAlgorithmicDarkeningAllowed(true);
        } else if (Build.VERSION.SDK_INT >= 29) {
            web.getSettings().setForceDark(WebSettings.FORCE_DARK_AUTO);
        }
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setGeolocationEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applySystemTheme();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && BASE.equals(uri.getScheme() + "://" + uri.getAuthority())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) callback.invoke(origin, true, false);
                else { callback.invoke(origin, false, false); requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 42); }
            }
        });
        if (state != null) {
            android.webkit.WebBackForwardList history = web.restoreState(state);
            if (history == null || history.getSize() == 0) web.loadUrl(BASE + "/login");
        } else {
            web.loadUrl(BASE + "/login");
        }
    }
    private void applySystemTheme() {
        if (web == null) return;
        boolean dark = (getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        String js = "(function(){"
            + "var dark=" + dark + ";"
            + "var id='rotix-native-theme';"
            + "var old=document.getElementById(id);if(old)old.remove();"
            + "var style=document.createElement('style');style.id=id;"
            + "style.textContent=dark?"
            + "'html{color-scheme:dark!important;--background:#0b1220!important;--foreground:#e5edf7!important}'"
            + ":'html{color-scheme:light!important;--background:#ffffff!important;--foreground:#171717!important}';"
            + "document.head.appendChild(style);"
            + "document.documentElement.style.colorScheme=dark?'dark':'light';"
            + "})();";
        web.evaluateJavascript(js, null);
    }
    @Override protected void onSaveInstanceState(Bundle outState) {
        web.saveState(outState);
        super.onSaveInstanceState(outState);
    }
    @Override public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Preserve the existing WebView, cookies and current page on UI mode changes.
        web.invalidate();
        applySystemTheme();
    }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
