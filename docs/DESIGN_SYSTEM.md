# Sistema de diseño — MEDICAL corp

Tema global Material (púrpura `#6200EE` + teal `#03DAC6`).

## Instalación y prueba

```bash
npm install
npx expo install expo-system-ui
npx expo start -c
```

Cambiar `primary` en `src/theme/colors.js` y recargar la app para ver el cambio en toda la UI.

## Colores (modo claro)

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#6200EE` | Botones, enlaces, foco |
| `secondary` | `#03DAC6` | Acentos secundarios |
| `background` | `#FFFFFF` | Fondo de pantalla |
| `surface` | `#FFFFFF` | Tarjetas, inputs |
| `textPrimary` | `#000000` | Títulos y cuerpo |
| `textSecondary` | `#666666` | Subtítulos |
| `error` / `danger` | `#B00020` | Errores |

Modo oscuro: `darkColors` en el mismo archivo.

## Tipografía

| Token | Tamaño | Peso |
|-------|--------|------|
| `h1` | 34 | bold (700) |
| `h2` | 24 | semibold (600) |
| `title` | 20 | medium (500) |
| `body` | 16 | normal (400) |
| `caption` | 12 | normal (400) |

Fuente: **Roboto** (Android) / sistema (iOS).

## Espaciado (base 8px)

| Token | px |
|-------|-----|
| `s` / `sm` | 8 |
| `m` / `md` | 16 |
| `l` / `lg` | 24 |
| `xl` | 32 |
| `minTouchTarget` | 44 |

## Uso en código

```javascript
import { useTheme, spacing, typography } from '../theme';

function MiPantalla() {
  const { colors } = useTheme();
  return (
    <Text style={[typography.h2, { color: colors.textPrimary }]}>
      Título
    </Text>
  );
}
```

## ThemeProvider

`App.js` envuelve la app con `<ThemeProvider>`. Todas las pantallas bajo `AppNavigator` tienen acceso a `useTheme()`.

## Navegación (Stack / Tabs)

- **Stack:** fondo `colors.primary`, título `typography.h2`, texto/íconos `colors.onPrimary`, sin sombra (`elevation: 0`).
- Configuración: `src/navigation/headerOptions.js` + `src/components/ui/NavigationHeader.js`.
- **Tabs:** fondo `surface`, activo `primary`, inactivo `textSecondary`; navegadores en `PatientTabNavigator.js` / `DoctorTabNavigator.js`.
- **MainTabsGate:** lee el rol en sesión al enfocar y muestra tabs de paciente o médico.
- **Layout tabs:** `TabScreenLayout` (scroll) o `tabListContent(insets)` (FlatList).

Flujo: `RoleSelection` → `Login` / `Register` → `MainTabs` → pantallas stack (`EditProfile`, `MedicalAI`, `Alerts`, etc.).

### Onboarding y auth

| Paso | Pantalla | Componentes clave |
|------|----------|-------------------|
| 1 | `RoleSelectionScreen` | `OnboardingProgress` (paso 1), `RoleOptionCard`, `ScreenHeader` |
| 2 | `LoginScreen` | Progreso paso 2, `RoleBadge`, `TextInputField`, `PasswordInput` |
| 3 | `RegisterScreen` | Progreso paso 3, validación + `authService.register` |
| — | `ConnectPatientScreen` | Flujo médico post-login: QR, feedback éxito/error |

Estilos compartidos: `authFormCardStyle()`, `authFormWrapStyle()`, `createAuthFieldStyle()` en `src/theme/authLayout.js`.

Pantallas sin barra nativa: `RoleSelection`, `MainTabs`.

## Inputs de formulario

Ubicación: `src/components/ui/inputs/`

| Componente | Uso |
|------------|-----|
| `TextInputField` | Texto, email, número, multilínea |
| `PasswordInput` | Contraseña con toggle mostrar/ocultar |
| `DropdownSelect` | Lista de opciones (modal) |

**Estilo:** fondo `surface`, borde 1px `secondary`, foco `primary`, `borderRadius` 8, padding `spacing.s`, label `typography.caption` con margen inferior `spacing.m`, placeholder `textSecondary`, error `colors.error` + `typography.caption`.

**Validación:** `required`, `validationType` (`text` \| `email` \| `number` \| `phone`), `validateOnBlur`, prop `error` externa.

```javascript
import { TextInputField, PasswordInput, DropdownSelect } from '../components';

<TextInputField
  label="Correo"
  placeholder="correo@ejemplo.com"
  value={email}
  onChangeText={setEmail}
  validationType="email"
  required
/>
<PasswordInput label="Contraseña" value={password} onChangeText={setPassword} required />
```

Pantallas migradas: Login, Register, EditProfile, PatientDetail (notas), MedicalHistory (métricas + ficha clínica), IAMedica (composer de chat).

## Componentes que consumen el tema

- `PrimaryButton`, `SecondaryButton`, `IconButton`, `Button` (alias)
- `TextInputField`, `PasswordInput`, `DropdownSelect`, `Input` (alias)
- `Card`, `ScreenContainer`
- `ScreenHeader`, `TabScreenLayout`, `RoleOptionCard`, `TextLink`, `IconCircle`
- `Header`, `StatBox`, `MedicalAlertBanner`

## Motion y microinteracciones

Tokens en `src/theme/motion.js` (`motion.duration`, `motion.scale.pressed` = 0.95).

| Elemento | Animación |
|----------|-----------|
| Botones (`PrimaryButton`, `SecondaryButton`, `IconButton`, `PressableScale`) | Spring scale 0.95 → 1 al presionar |
| Inputs (`TextInputField`, `PasswordInput`, `DropdownSelect`) | Borde `secondary` → `primary` (200 ms); shake en error; toggle ojo con bounce |
| Errores de campo | Fade-in del mensaje (`AnimatedFieldError`) |
| Modal selector | Backdrop fade + sheet slide-up (spring) |
| Pantallas auth | `ScreenContainer animateEnter` — fade + slide 14px |
| Stack navigator | `animationDuration: 280` ms |

Hooks: `useFieldMotion`, `useScreenEnter`, `usePressFeedback`.

## Accesibilidad

- UI en español
- Contraste ≥ 4.5:1
- Áreas táctiles ≥ 44px
