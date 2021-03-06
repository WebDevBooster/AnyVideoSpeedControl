var a = {
    speedStep: 0.25,
    slowerKeyCode: '109,189',
    fasterKeyCode: '107,187',
    resetKeyCode: '106',
    displayOption: 'FadeInFadeOut',
    allowMouseWheel: true,
    rememberSpeed: false
};

function b(o) {
    var p = String.fromCharCode(o.keyCode);
    if (!/[\d\.]$/.test(p) || !/^\d+(\.\d*)?$/.test(o.target.value + p)) {
        o.preventDefault();
        o.stopPropagation();
    }
};

function d() {
    var o = document.getElementById('speedStep').value;
    var p = document.getElementById('slowerKeyInput').value;
    var q = document.getElementById('fasterKeyInput').value;
    var r = document.getElementById('resetKeyInput').value;
    var s = document.getElementById('allowMouseWheel').checked;
    var t = document.getElementById('rememberSpeed').checked;
    var u;
    var v = document.getElementsByName('displayOption');
    for (var w = 0, length = v.length; w < length; w++) {
        if (v[w].checked) {
            u = v[w].value;
            break;
        }
    }
    o = isNaN(o) ? a.speedStep : Number(o);
    chrome.storage.sync.set({
        speedStep: o,
        slowerKeyCode: p,
        fasterKeyCode: q,
        resetKeyCode: r,
        displayOption: u,
        allowMouseWheel: s,
        rememberSpeed: t
    }, function () {
        var M = document.getElementById('status');
        M.textContent = 'Options saved';
        setTimeout(function () {
            M.textContent = '';
        }, 1000);
    });
};

function e() {
    chrome.storage.sync.get(a, function (M) {
        document.getElementById('speedStep').value = M.speedStep.toFixed(2);
        document.getElementById('slowerKeyInput').value = M.slowerKeyCode;
        document.getElementById('fasterKeyInput').value = M.fasterKeyCode;
        document.getElementById('resetKeyInput').value = M.resetKeyCode;
        document.getElementById(M.displayOption).checked = true;
        document.getElementById('allowMouseWheel').checked = M.allowMouseWheel;
        document.getElementById('rememberSpeed').checked = M.rememberSpeed;
    });
};

function f() {
    chrome.storage.sync.set(a, function () {
        e();
        var M = document.getElementById('status');
        M.textContent = 'Default options restored';
        setTimeout(function () {
            M.textContent = '';
        }, 1000);
    });
};
document.addEventListener('DOMContentLoaded',
    function () {
        e();
        document.getElementById('save').addEventListener('click', d);
        document.getElementById('restore').addEventListener('click', f);
        document.getElementById('speedStep').addEventListener('keypress', b);
    }
);
$(document).ready(function () {
    var o = $('#fasterKeyInput');
    var p = $('#slowerKeyInput');
    var q = $('#resetKeyInput');
    $.getJSON('keycodedict.json', function (M) {
        o.html('');
        p.html('');
        q.html('');
        $.each(M.keycodedict, function (R, S) {
            o.append(new Option(S.input, S.keycode));
            p.append(new Option(S.input, S.keycode));
            q.append(new Option(S.input, S.keycode));
        })
    });
});
