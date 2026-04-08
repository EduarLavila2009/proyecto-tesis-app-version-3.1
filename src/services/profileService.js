import * as storageService from './storageService';

/**
 * Actualiza datos de perfil en sesión y en la lista USERS (mismo id).
 * No modifica la contraseña salvo que se envíe en updates (no recomendado).
 *
 * @param {object} updates Parciales: name, email, phone, avatar, etc.
 * @returns {Promise<{ success: boolean, user?: object, message?: string }>}
 */
export async function updateUserProfile(updates) {
  try {
    const current = await storageService.getUser();
    if (!current?.id) {
      return { success: false, message: 'No hay sesión activa.' };
    }

    const { password: _ignore, ...safeUpdates } = updates;
    const merged = {
      ...current,
      ...safeUpdates,
    };

    await storageService.saveUser(merged);

    const users = await storageService.getUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...safeUpdates,
        password: users[idx].password,
        id: users[idx].id,
      };
      await storageService.saveUsers(users);
    }

    return { success: true, user: merged };
  } catch (error) {
    console.error('profileService.updateUserProfile', error);
    return {
      success: false,
      message: 'No se pudieron guardar los cambios.',
    };
  }
}
