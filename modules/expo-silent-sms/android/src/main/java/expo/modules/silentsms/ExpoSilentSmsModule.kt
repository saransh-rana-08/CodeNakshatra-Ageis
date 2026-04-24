package expo.modules.silentsms

import android.Manifest
import android.content.pm.PackageManager
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoSilentSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSilentSms")

    AsyncFunction("isAvailableAsync") { ->
       return@AsyncFunction true
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      val permissionsManager = appContext.permissions
      if (permissionsManager == null) {
        promise.reject("ERR_SYS", "Permissions module not found", null)
        return@AsyncFunction
      }
      permissionsManager.askForPermissions(
        { permissionsResponse ->
          val granted = permissionsResponse[Manifest.permission.SEND_SMS]?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED
          promise.resolve(granted)
        },
        Manifest.permission.SEND_SMS
      )
    }

    AsyncFunction("sendSMSAsync") { phoneNumber: String, message: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("ERR_CONTEXT", "React Context missing", null)
        return@AsyncFunction
      }
      
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
         promise.reject("ERR_PERMISSION", "SEND_SMS permission is not granted", null)
         return@AsyncFunction
      }
      
      try {
        val smsManager = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            context.getSystemService(android.telephony.SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            android.telephony.SmsManager.getDefault()
        }
        
        if (smsManager == null) {
          promise.reject("ERR_SMS_MANAGER", "SmsManager is not available", null)
          return@AsyncFunction
        }

        smsManager.sendTextMessage(phoneNumber, null, message, null, null)
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("ERR_SEND", "Failed to send SMS: ${e.message}", e)
      }
    }
  }
}
