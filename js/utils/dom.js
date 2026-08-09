/* Utilities: DOM helpers */

export function findByIds(...ids) {

    for (const id of ids) {

        const el = document.getElementById(id);

        if (el) return el;

    }

    return null;

}
