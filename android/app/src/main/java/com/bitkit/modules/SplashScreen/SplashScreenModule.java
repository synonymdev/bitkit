package com.bitkit.modules.SplashScreen;

import android.app.Activity;
import android.app.Dialog;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.bitkit.R;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.ref.WeakReference;

public class SplashScreenModule extends ReactContextBaseJavaModule {
    private static WeakReference<Activity> mainActivityRef;
    private static Dialog splashDialog;

    SplashScreenModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return "SplashScreenModule";
    }

    @ReactMethod
    public void hide() {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null && mainActivityRef != null) {
            currentActivity = mainActivityRef.get();
        }

        if (currentActivity == null || splashDialog == null) {
            return;
        }

        final Activity activity = currentActivity;

        activity.runOnUiThread(() -> {
            boolean isDestroyed = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                isDestroyed = activity.isDestroyed();
            }

            if (
                    !activity.isFinishing() &&
                            !isDestroyed &&
                            splashDialog != null &&
                            splashDialog.isShowing()
            ) {
                splashDialog.dismiss();
            }

            splashDialog = null;
        });
    }

    public static void show(@NonNull final Activity activity) {
        mainActivityRef = new WeakReference<>(activity);

        // Set app background color back to black
        activity.getWindow().setBackgroundDrawableResource(R.color.black);
        activity.getWindow().setNavigationBarColor(ContextCompat.getColor(activity, R.color.black));

        activity.runOnUiThread(() -> {
            // Leave out the second argument if you're not using animations
            splashDialog = new Dialog(activity, R.style.AppTheme_SplashDialog);
            // Set splash screen status & navigation bar color
            splashDialog.getWindow().setStatusBarColor(ContextCompat.getColor(activity, R.color.brand));
            splashDialog.getWindow().setNavigationBarColor(ContextCompat.getColor(activity, R.color.brand));
            splashDialog.setContentView(R.layout.splash_screen);
            splashDialog.setCancelable(false);

            if (!splashDialog.isShowing() && !activity.isFinishing()) {
                splashDialog.show();
            }
        });
    }
}
