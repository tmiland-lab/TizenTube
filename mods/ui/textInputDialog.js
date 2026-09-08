// Minimal text-input dialog for the TV UI (YouTube's renderer system has no
// text input component, so we render our own DOM layer, styled to match).
// Submit: Enter or OK. Cancel: Escape, Back (popstate) or Cancel.

export default function showTextInput({ title, placeholder = '', initial = '', onSubmit }) {
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'fixed', inset: '0', zIndex: '99999',
        background: 'rgba(0,0,0,0.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        background: '#212121', borderRadius: '12px', padding: '24px',
        minWidth: '420px', maxWidth: '640px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
    });

    const titleEl = document.createElement('div');
    Object.assign(titleEl.style, { color: '#fff', fontSize: '20px', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' });
    titleEl.textContent = title;

    const input = document.createElement('input');
    Object.assign(input.style, {
        width: '100%', boxSizing: 'border-box', padding: '12px 14px',
        fontSize: '18px', color: '#fff', background: '#0f0f0f',
        border: '2px solid #3f3f3f', borderRadius: '8px', outline: 'none'
    });
    input.placeholder = placeholder;
    input.value = initial;
    input.addEventListener('focus', () => { input.style.borderColor = '#f03'; });
    input.addEventListener('blur', () => { input.style.borderColor = '#3f3f3f'; });

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '12px', marginTop: '18px', justifyContent: 'flex-end' });

    let done = false;

    function teardown() {
        done = true;
        document.removeEventListener('keydown', captureKeys, true);
        window.removeEventListener('popstate', onCancel);
        backdrop.remove();
    }

    function submit() {
        const value = input.value.trim();
        if (!value) { input.focus(); return; }
        teardown();
        onSubmit(value);
    }

    function onCancel() { if (!done) { teardown(); } }

    function captureKeys(e) {
        if (e.target === input) {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); return; }
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); return; }
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.stopPropagation();
            }
            return;
        }
        e.stopPropagation();
    }

    function mkButton(label, primary, onClick) {
        const b = document.createElement('button');
        b.textContent = label;
        Object.assign(b.style, {
            padding: '10px 22px', fontSize: '16px', borderRadius: '8px',
            cursor: 'pointer', border: 'none',
            background: primary ? '#f03' : '#3f3f3f', color: '#fff'
        });
        b.addEventListener('click', onClick);
        return b;
    }

    row.appendChild(mkButton('Cancel', false, onCancel));
    row.appendChild(mkButton('OK', true, submit));

    box.appendChild(titleEl);
    box.appendChild(input);
    box.appendChild(row);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    document.addEventListener('keydown', captureKeys, true);
    window.addEventListener('popstate', onCancel);
    requestAnimationFrame(() => input.focus());
}
