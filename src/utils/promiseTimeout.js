/**
 * Envuelve una promesa para que falle si supera el tiempo de espera (timeout).
 * Útil para operaciones de red/Firebase que pueden quedarse colgadas.
 *
 * @param {Promise<any>} promise La promesa original.
 * @param {number} ms Tiempo límite en milisegundos.
 * @returns {Promise<any>}
 */
export function runWithTimeout(promise, ms = 2000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('TIMEOUT_ERROR'));
    }, ms);
  });

  return Promise.race([
    promise.then((val) => {
      clearTimeout(timeoutId);
      return val;
    }),
    timeoutPromise,
  ]).catch((err) => {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  });
}
