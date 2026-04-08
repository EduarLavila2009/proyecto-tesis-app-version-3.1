# Sistema de Diseno UI

Guia consolidada del sistema visual de la app (tema, componentes, iconos, accesibilidad y animaciones).

## Fuente de verdad

- `src/theme/colors.js`
- `src/theme/spacing.js`
- `src/theme/typography.js`
- `src/theme/accessibility.js`

Import recomendado:

```js
import { colors, spacing, typography, hitSlopComfortable } from '../theme';
```

## Paleta de colores (`colors.js`)

- `primary` (`#2563EB`): color principal de marca (botones primarios, iconos clave).
- `secondary` (`#22C55E`): estados positivos/estables.
- `secondaryMuted` (`rgba(34, 197, 94, 0.12)`): fondo suave para chips/metricas.
- `background` (`#F8FAFC`): fondo global de pantallas.
- `surface` (`#FFFFFF`): fondo de cards, inputs y bloques.
- `textPrimary` (`#0F172A`): texto principal.
- `textSecondary` (`#64748B`): texto secundario/ayuda.
- `danger` (`#EF4444`): errores, alertas y acciones destructivas.
- `onPrimary` (`#FFFFFF`): texto/icono sobre fondo primario.
- `borderSubtle` (`#E2E8F0`): bordes y separadores suaves.
- `shadow` (`#0F172A`): color base de sombra.
- `buttonDisabled` (`#E2E8F0`): fondo de boton deshabilitado.
- `buttonDisabledText` (`#334155`): texto de boton deshabilitado.

## Escala de espaciado (`spacing.js`)

Escala base:

- `xs = 4`
- `sm = 8`
- `md = 16`
- `lg = 24`
- `xl = 32`

Tokens extra:

- `radiusInput = 6`
- `radiusButton = 12`
- `radiusCard = 16`
- `shadowOpacityCard = 0.08`

Regla practica:

- micro-ajustes: `xs` / `sm`
- padding estandar: `md`
- separacion entre bloques: `lg`
- separacion amplia: `xl`

## Tipografia (`typography.js`)

- `title`: `{ fontSize: 24, fontWeight: '700' }` (titulos principales)
- `subtitle`: `{ fontSize: 18, fontWeight: '600' }` (subtitulos y encabezados de seccion)
- `body`: `{ fontSize: 14, fontWeight: '400' }` (texto normal)
- `caption`: `{ fontSize: 12, fontWeight: '400' }` (notas y labels)

## Ejemplo de uso en `StyleSheet`

```js
import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
});
```

## Componentes reutilizables (`src/components`)

### `Card`
- **Proposito:** contenedor visual para secciones.
- **Props clave:** `children`, `style`.

```jsx
<Card style={{ marginBottom: 8 }}>
  <Text>Contenido</Text>
</Card>
```

### `Header`
- **Proposito:** titulo consistente de pantalla/seccion.
- **Props clave:** `title`, `style`, `textStyle`.

```jsx
<Header title="Mi Perfil" />
```

### `Button`
- **Proposito:** boton primario reusable.
- **Props clave:** `title`, `onPress`, `disabled`, `style`, `accessibilityLabel`.

```jsx
<Button title="Entrar" onPress={handleLogin} disabled={isSubmitDisabled} />
```

### `Input`
- **Proposito:** campo de texto con estados base/focus.
- **Props clave:** `value`, `onChangeText`, `placeholder`, `secureTextEntry`, `keyboardType`, `accessibilityLabel`.

```jsx
<Input
  value={email}
  onChangeText={setEmail}
  placeholder="nombre@correo.com"
  keyboardType="email-address"
/>
```

### `StatBox`
- **Proposito:** indicador compacto (valor + etiqueta).
- **Props clave:** `value`, `label`, `style`.

```jsx
<StatBox value={98} label="Oxígeno (SpO₂)" />
```

### `Icon`
- **Proposito:** iconos SVG locales y soporte Ionicons/MCI.
- **Props clave:** `name`, `size`, `color`, `style`, `accessibilityLabel`.
- **Compatibilidad existente:** `preset`, `ionicon`, `mci`, `svg`.

```jsx
<Icon name="home" size={24} color="#2563EB" />
```

## Lista de iconos (`Icon name="..."`)

Nombres disponibles:

- `home`
- `dashboard`
- `heart`
- `calendar`
- `user`
- `settings`
- `logout`
- `blood`
- `temperature`
- `lungs`
- `ai`
- `folder`
- `edit`
- `delete`
- `medical`

Tambien se puede usar `@expo/vector-icons`:

- `Ionicons`
- `MaterialCommunityIcons`

Ejemplos:

```jsx
<Icon name="blood" size={22} color="#0F172A" />
<Icon ionicon="home-outline" size={22} color="#2563EB" />
<Icon mci="stethoscope" size={22} color="#2563EB" />
```

## Accesibilidad (resumen)

- Contraste orientado a WCAG AA (texto normal >= 4.5:1) usando tokens del theme.
- Tamaño tactil mejorado con `hitSlopComfortable` y `minHeight` en controles.
- Uso de `accessibilityLabel` y `accessibilityRole` en inputs y botones.
- Uso de `allowFontScaling` para respetar ajustes del sistema.

Herramientas recomendadas:

- TalkBack (Android), VoiceOver (iOS)
- Accessibility Scanner (Android), Accessibility Inspector (iOS)
- Validadores de contraste y QA manual de foco/lectura

## Animaciones (resumen)

- **Botones:** efecto de presion con escala (`Animated.spring`, `useNativeDriver: true`).
- **Transiciones de pantalla:** stack con `animation: 'default'` (slide nativo).
- **Layout:** `LayoutAnimation.configureNext(...)` en formularios para transiciones suaves.
- **Dashboard:** entrada de metricas con fade-in + translateY.

## Principio clave

Evita valores hardcodeados en pantallas.  
Prioriza siempre `colors`, `spacing`, `typography` y componentes reutilizables para mantener consistencia y mantenimiento simple.
