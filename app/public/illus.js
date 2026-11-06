// Illustrations originales de Genius Recrutement (SVG), partagées par toutes les pages.
// window.GR.person(kind, size), GR.famIcon(k), GR.pattern(id), GR.empty(kind)
(function () {
  var C = { teal: '#0E7C86', tealD: '#084F49', indigo: '#25306B', mango: '#F2A541', mangoD: '#D9862A', leaf: '#5FB49C', sky: '#BFE3DC', skin1: '#6B3E26', skin2: '#8D5A3B', skin3: '#4A2A1A', hair: '#1A1210', white: '#FFFFFF' };
  function person(kind, size) {
    size = size || 160;
    var s = {
      awa: { skin: C.skin2, top: C.mango, accent: C.teal, wrap: true },
      moussa: { skin: C.skin1, top: C.indigo, accent: C.mango, glasses: true },
      fatou: { skin: C.skin3, top: C.teal, accent: C.mango, bun: true },
      ibou: { skin: C.skin2, top: C.leaf, accent: C.indigo, cap: false }
    }[kind] || {};
    var head = '<circle cx="80" cy="64" r="26" fill="' + s.skin + '"/>';
    var hair = s.wrap
      ? '<path d="M50 60c-2-24 12-40 30-40s32 14 30 40c-4-9-16-15-30-15s-26 6-30 15z" fill="' + s.accent + '"/><circle cx="104" cy="30" r="9" fill="' + s.accent + '"/><path d="M98 24c8-8 18-6 20 2" fill="' + s.accent + '"/><path d="M54 50c10-9 34-12 52-2M56 40c12-8 32-9 46 0" stroke="' + C.mango + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : s.bun
        ? '<circle cx="80" cy="32" r="12" fill="' + C.hair + '"/><path d="M54 62c0-18 12-30 26-30s26 12 26 30c-4-10-14-16-26-16s-22 6-26 16z" fill="' + C.hair + '"/>'
        : '<path d="M55 58c0-17 11-28 25-28s25 11 25 28c-3-8-12-13-25-13s-22 5-25 13z" fill="' + C.hair + '"/>';
    var face = '<circle cx="71" cy="66" r="2.2" fill="' + C.hair + '"/><circle cx="89" cy="66" r="2.2" fill="' + C.hair + '"/><path d="M73 76c4 3 10 3 14 0" stroke="' + C.hair + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      (s.glasses ? '<circle cx="71" cy="66" r="6" fill="none" stroke="' + C.hair + '" stroke-width="2"/><circle cx="89" cy="66" r="6" fill="none" stroke="' + C.hair + '" stroke-width="2"/><path d="M77 66h6" stroke="' + C.hair + '" stroke-width="2"/>' : '');
    var body = '<path d="M34 160c0-30 20-50 46-50s46 20 46 50z" fill="' + s.top + '"/><path d="M70 110l10 14 10-14" fill="none" stroke="' + C.white + '" stroke-width="3" stroke-linejoin="round" opacity=".7"/>' +
      '<rect x="71" y="84" width="18" height="30" rx="7" fill="' + s.skin + '"/>';
    return '<svg viewBox="0 0 160 160" width="' + size + '" height="' + size + '" aria-hidden="true">' + body + head + hair + face + '</svg>';
  }
  var icons = {
    cc: '<path d="M5 13v-1a7 7 0 0 1 14 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/>',
    vente: '<path d="M3 12l7-7h6l5 5-9 9z"/><circle cx="15" cy="8.5" r="1.4"/>',
    compta: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15v3"/>',
    rh: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5"/>',
    admin: '<path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 7V5a1 1 0 0 1 1-1h5l2 2"/>'
  };
  function famIcon(k, size) { return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[k] || icons.admin) + '</svg>'; }
  var famColor = { cc: C.teal, vente: C.mangoD, compta: C.indigo, rh: '#7A3E8E', admin: '#2F6F9F' };
  // Bande de motifs géométriques inspirée des pagnes wax et du bogolan.
  function pattern(id, h) {
    h = h || 28;
    return '<svg class="gr-band" width="100%" height="' + h + '" aria-hidden="true" preserveAspectRatio="none"><defs><pattern id="' + id + '" width="56" height="28" patternUnits="userSpaceOnUse">' +
      '<rect width="56" height="28" fill="' + C.indigo + '"/><path d="M0 28L14 0l14 28z" fill="' + C.teal + '"/><path d="M28 28L42 0l14 28z" fill="' + C.mango + '"/>' +
      '<path d="M14 28l7-14 7 14z" fill="' + C.indigo + '"/><path d="M42 28l7-14 7 14z" fill="' + C.indigo + '"/><circle cx="28" cy="7" r="2.6" fill="' + C.white + '"/><circle cx="0" cy="7" r="2.6" fill="' + C.white + '"/><circle cx="56" cy="7" r="2.6" fill="' + C.white + '"/>' +
      '</pattern></defs><rect width="100%" height="' + h + '" fill="url(#' + id + ')"/></svg>';
  }
  var emptyIc = {
    offres: '<path d="M4 7h16v12H4z"/><path d="M9 7V5h6v2"/>',
    candidats: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/>',
    tests: '<path d="M8 4h8v3H8z"/><rect x="5" y="5.5" width="14" height="15" rx="2"/><path d="m9 13 2 2 4-4"/>'
  };
  function empty(kind) { return '<div class="empty-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (emptyIc[kind] || emptyIc.tests) + '</svg></div>'; }
  window.GR = { person: person, famIcon: famIcon, famColor: famColor, pattern: pattern, empty: empty, C: C };
})();
