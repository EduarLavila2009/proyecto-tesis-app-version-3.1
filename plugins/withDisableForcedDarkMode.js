const { createRunOncePlugin, withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

/**
 * Complemento de Configuración de Expo (Config Plugin)
 * Inyecta el atributo `android:forceDarkAllowed="false"` dentro del tema principal
 * (AppTheme) en el archivo xml de estilos generado para Android.
 * Esto evita que sistemas operativos como MIUI/HyperOS (Xiaomi) fuercen la inversión de colores
 * cuando el usuario activa el modo oscuro global en el móvil pero la app está en modo claro.
 */
function setForceDarkModeToFalse(styles) {
  return AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    parent: { name: 'AppTheme' },
    name: 'android:forceDarkAllowed',
    value: 'false',
  });
}

const withDisableForcedDarkMode = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setForceDarkModeToFalse(config.modResults);
    return config;
  });
};

module.exports = createRunOncePlugin(
  withDisableForcedDarkMode,
  'disable-forced-dark-mode',
  '1.0.0'
);
