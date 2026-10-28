(function () {
  "use strict";
  var RESET = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}';
  var FONT = 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap';
  var STYLE_SRC = document.getElementById('pf-style').textContent;
  var APP_SRC = document.getElementById('pf-app').textContent;
  var ICONS_SRC = document.getElementById('pf-icons').textContent;
  var ICONS = JSON.parse(ICONS_SRC);
  var DATA = JSON.parse(document.getElementById('pf-data').textContent);
  var draft = null;
  var view = DATA;
  var state = { qopen: {}, expanded: {}, isEditor: false, artifact: null, db: null, user: null, assets: null, messages: [], tab: 'profile', dirty: false, sent: false, sending: false, readOnly: false };

  // ---------- data defaults ----------
  var DEFAULT_SECTIONS = [
    { id: 'stack', show: true, nav: '', eyebrow: '', title: '', subtitle: '' },
    { id: 'about', show: true, nav: 'About', eyebrow: 'About', title: 'A developer who cares about the *details*.', subtitle: '' },
    { id: 'work', show: true, nav: 'Work', eyebrow: 'Selected work', title: 'Projects I have *built and shipped*.', subtitle: '' },
    { id: 'experience', show: true, nav: 'Experience', eyebrow: 'Experience', title: 'Where I have *worked and learned*.', subtitle: '' },
    { id: 'testimonials', show: true, nav: 'Testimonials', eyebrow: 'Testimonials', title: 'Kind words from *people I\u2019ve worked with*.', subtitle: 'Recommendations from clients, managers and teammates.' },
    { id: 'achievements', show: true, nav: 'Awards', eyebrow: 'Achievements', title: 'Recognition along the *way*.', subtitle: '' },
    { id: 'certifications', show: true, nav: 'Certifications', eyebrow: 'Certifications', title: 'Always *learning*.', subtitle: '' },
    { id: 'socials', show: true, nav: 'Socials', eyebrow: 'Find me online', title: 'Where I am *active*.', subtitle: '' },
    { id: 'contact', show: true, nav: 'Contact', eyebrow: 'Contact', title: 'Let’s build something *together*.', subtitle: '' }
  ];
  var SECTION_NAMES = { stack: 'Tech strip', about: 'About & skills', work: 'Projects', experience: 'Experience', testimonials: 'Testimonials', achievements: 'Achievements', certifications: 'Certifications', socials: 'Socials', contact: 'Contact' };
  function normalize(d) {
    d = d || {};
    d.theme = Object.assign({ accent: '#2b59e8', background: 'aurora', animate: true, grain: true, defaultMode: 'auto', serifAccent: true }, d.theme || {});
    d.profile = Object.assign({ name: 'Your Name', initials: '', role: '', company: '', headline: '', rotatePrefix: '', rotating: [], bio: '', location: '', timezone: 'Asia/Kolkata', tzLabel: 'IST', available: false, availabilityText: '', avatar: '', focus: '', yearsLabel: '', resume: '', ctaPrimary: 'View my work', ctaSecondary: 'Get in touch', footer: '' }, d.profile || {});
    if (d.profile.headlineMuted && d.profile.headline.indexOf('*') < 0) { d.profile.headline += ' *' + d.profile.headlineMuted + '*'; delete d.profile.headlineMuted; }
    d.contact = Object.assign({ email: '', phone: '', discord: '', address: '', note: '', form: true }, d.contact || {});
    ['stats', 'skills', 'learning', 'interests', 'projects', 'experience', 'testimonials', 'achievements', 'certifications', 'socials'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    if (d.contact.linkedin) { d.socials.push({ platform: 'linkedin', url: d.contact.linkedin, handle: '', description: '', metric: '' }); delete d.contact.linkedin; }
    if (d.contact.github) { d.socials.push({ platform: 'github', url: d.contact.github, handle: '', description: '', metric: '' }); delete d.contact.github; }
    if (!Array.isArray(d.sections)) d.sections = clone(DEFAULT_SECTIONS);
    DEFAULT_SECTIONS.forEach(function (s) {
      if (d.sections.some(function (x) { return x.id === s.id; })) return;
      var ci = d.sections.map(function (x) { return x.id; }).indexOf(s.id === 'testimonials' ? 'achievements' : 'contact');
      if (ci < 0) d.sections.push(clone(s)); else d.sections.splice(ci, 0, clone(s));
    });
    d.sections = d.sections.filter(function (s) { return SECTION_NAMES[s.id]; });
    d.version = 3;
    return d;
  }
  DATA = normalize(DATA); view = DATA;

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rich(s) { var h = esc(s); return view.theme.serifAccent === false ? h.replace(/\*([^*]+)\*/g, '$1') : h.replace(/\*([^*]+)\*/g, '<em class="accent-word">$1</em>'); }
  function plain(s) { return String(s || '').replace(/\*/g, ''); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (/^\/_blob\//.test(u)) return u; if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u; return ''; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function sec(id) { return view.sections.filter(function (s) { return s.id === id; })[0] || {}; }
  function shown(id) { var s = sec(id); return s.show !== false; }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  var P = {
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    arrow: '<path d="M7 7h10v10M7 17 17 7"/>',
    right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    brief: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    pen: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    medal: '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8"/><circle cx="12" cy="17" r="5"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 17v4M17 19h4"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
  };
  function ic(name, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>'; }

  // ---------- brand / tech icons ----------
  var ALIAS = { html: 'html5', vue: 'vuedotjs', vuejs: 'vuedotjs', node: 'nodedotjs', nodejs: 'nodedotjs', next: 'nextdotjs', nextjs: 'nextdotjs', reactjs: 'react', reactnative: 'react', js: 'javascript', ts: 'typescript', k8s: 'kubernetes', golang: 'go', mongo: 'mongodb', postgres: 'postgresql', tailwind: 'tailwindcss', gcp: 'googlecloud', amazonwebservices: 'aws', awscloud: 'aws', twitterx: 'x', devto: 'devdotto', devdotto: 'devdotto', rails: 'rubyonrails', sklearn: 'scikitlearn', threejs: 'threedotjs', d3js: 'd3', d3dotjs: 'd3', materialui: 'mui', shadcn: 'shadcnui', csharp: 'dotnet', net: 'dotnet', aspnet: 'dotnet', expressjs: 'express', nuxtjs: 'nuxt', nuxtdotjs: 'nuxt', bash: 'gnubash', shell: 'gnubash', css3: 'css', scss: 'sass', socketio: 'socketdotio', nestjs: 'nestjs', springboot: 'springboot', mysqldb: 'mysql', tf: 'tensorflow', openjdk: 'openjdk', microsoftazure: 'azure', visualstudiocode: 'vscodium', vscode: 'vscodium', gh: 'github', githubcopilot: 'github', amazon: 'aws', meta: 'meta', facebookmeta: 'meta', cpp: 'cplusplus', 'c++': 'cplusplus', reactquery: 'reactquery', tanstackquery: 'reactquery', framermotion: 'framer', huggingface: 'huggingface', chatgpt: 'openai', ms: 'microsoft', msoffice: 'microsoft', microsoftoffice: 'microsoft', stackoverflow: 'stackoverflow', leetcode: 'leetcode', email: '', website: '' };
  function key(name) {
    var k = String(name || '').toLowerCase().trim().replace(/\+/g, 'plus').replace(/#/g, 'sharp').replace(/\./g, 'dot').replace(/[^a-z0-9]/g, '');
    if (ICONS[k]) return k;
    var k2 = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ALIAS[k2] && ICONS[ALIAS[k2]]) return ALIAS[k2];
    if (ICONS[k2]) return k2;
    if (k.slice(-6) === 'dotjs' && ICONS[k.slice(0, -6)]) return k.slice(0, -6);
    if (k.slice(-2) === 'js' && ICONS[k.slice(0, -2)]) return k.slice(0, -2);
    return '';
  }
  function lum(hex) {
    var n = parseInt(hex, 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    var f = function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function brandColor(k) { var i = ICONS[k]; if (!i) return ''; var L = lum(i.h); return (L < 0.05 || L > 0.8) ? '' : '#' + i.h; }
  // icon html (inner svg only) + brand colour for a tech / platform name
  function techIcon(name) {
    var k = key(name), i = ICONS[k];
    if (!i) return { html: '<span class="mono-ico" aria-hidden="true">' + esc(plain(name).replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '•') + '</span>', color: '', found: false };
    return { html: '<svg class="bi" viewBox="' + (i.v || '0 0 24 24') + '" aria-hidden="true"><path d="' + i.p + '"/></svg>', color: brandColor(k), found: true };
  }
  function tiSpan(name, extra) {
    var t = techIcon(name);
    return '<span class="ti' + (t.color ? '' : ' mono') + (extra ? ' ' + extra : '') + '"' + (t.color ? ' style="--brand:' + t.color + '"' : '') + '>' + t.html + '</span>';
  }

  var PLATFORMS = {
    linkedin: { n: 'LinkedIn', i: 'linkedin', base: 'https://www.linkedin.com/in/' }, github: { n: 'GitHub', i: 'github', base: 'https://github.com/' }, medium: { n: 'Medium', i: 'medium', base: 'https://medium.com/@' },
    x: { n: 'X (Twitter)', i: 'x', base: 'https://x.com/' }, discord: { n: 'Discord', i: 'discord', base: '' }, instagram: { n: 'Instagram', i: 'instagram', base: 'https://instagram.com/' },
    youtube: { n: 'YouTube', i: 'youtube', base: 'https://youtube.com/@' }, dribbble: { n: 'Dribbble', i: 'dribbble', base: 'https://dribbble.com/' }, behance: { n: 'Behance', i: 'behance', base: 'https://behance.net/' },
    devto: { n: 'DEV', i: 'devdotto', base: 'https://dev.to/' }, hashnode: { n: 'Hashnode', i: 'hashnode', base: '' }, substack: { n: 'Substack', i: 'substack', base: '' },
    stackoverflow: { n: 'Stack Overflow', i: 'stackoverflow', base: '' }, leetcode: { n: 'LeetCode', i: 'leetcode', base: 'https://leetcode.com/u/' }, hackerrank: { n: 'HackerRank', i: 'hackerrank', base: 'https://www.hackerrank.com/profile/' },
    kaggle: { n: 'Kaggle', i: 'kaggle', base: 'https://kaggle.com/' }, threads: { n: 'Threads', i: 'threads', base: 'https://threads.net/@' }, bluesky: { n: 'Bluesky', i: 'bluesky', base: 'https://bsky.app/profile/' },
    mastodon: { n: 'Mastodon', i: 'mastodon', base: '' }, telegram: { n: 'Telegram', i: 'telegram', base: 'https://t.me/' }, whatsapp: { n: 'WhatsApp', i: 'whatsapp', base: 'https://wa.me/' },
    reddit: { n: 'Reddit', i: 'reddit', base: 'https://reddit.com/u/' }, twitch: { n: 'Twitch', i: 'twitch', base: 'https://twitch.tv/' }, facebook: { n: 'Facebook', i: 'facebook', base: 'https://facebook.com/' },
    producthunt: { n: 'Product Hunt', i: 'producthunt', base: 'https://www.producthunt.com/@' }, geeksforgeeks: { n: 'GeeksforGeeks', i: 'geeksforgeeks', base: '' }, codechef: { n: 'CodeChef', i: 'codechef', base: 'https://www.codechef.com/users/' },
    website: { n: 'Website', g: 'globe', base: '' }, blog: { n: 'Blog', g: 'pen', base: '' }, other: { n: 'Link', g: 'link', base: '' }
  };
  function platformInfo(s) {
    var p = PLATFORMS[s.platform] || PLATFORMS.other;
    var html, color = '', mono = true;
    if (p.i && ICONS[p.i]) { var i = ICONS[p.i]; html = '<svg class="bi" viewBox="' + (i.v || '0 0 24 24') + '" aria-hidden="true"><path d="' + i.p + '"/></svg>'; color = brandColor(p.i); mono = !color; }
    else html = ic(p.g || 'link');
    return { name: p.n, html: html, color: color, mono: mono };
  }
  function socialUrl(s) {
    var u = String(s.url || '').trim(); if (!u) return '';
    var p = PLATFORMS[s.platform] || {};
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return 'https://' + u;
    if (p.base) return p.base + u.replace(/^@/, '');
    return '';
  }
  function socialHandle(s) {
    if (s.handle) return s.handle;
    var u = String(s.url || '').trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    if (!u) return '';
    var parts = u.split('/'); var last = parts[parts.length - 1];
    if (parts.length > 1 && last) return (last.charAt(0) === '@' ? '' : '@') + last.replace(/^in$/, parts[parts.length - 2]);
    return u;
  }

  // ---------- theme & appearance ----------
  function hexToHsl(hex) {
    hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) { var d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  function hsl(h, s, l) { return 'hsl(' + ((h % 360) + 360) % 360 + ' ' + Math.round(s) + '% ' + Math.round(l) + '%)'; }
  var ACCENTS = [['Cobalt', '#2b59e8'], ['Violet', '#6d4aff'], ['Emerald', '#0f9f6e'], ['Rose', '#e0386b'], ['Amber', '#c26a00'], ['Teal', '#0e8fa3'], ['Graphite', '#3a3f4b']];
  var accentHue = 225, accentSat = 80;
  function applyAppearance() {
    var t = view.theme, hex = /^#[0-9a-f]{3,6}$/i.test(t.accent || '') ? t.accent : '#2b59e8';
    var c = hexToHsl(hex), h = c[0], s = Math.max(c[1], 8), l = c[2];
    accentHue = h; accentSat = s;
    var root = document.documentElement.style;
    root.setProperty('--acc-l', hex);
    root.setProperty('--acc2-l', hsl(h + 28, s, Math.min(l + 8, 62)));
    root.setProperty('--acc-d', hsl(h, Math.min(s, 92), Math.max(70, l + 20)));
    root.setProperty('--acc2-d', hsl(h + 28, Math.min(s, 90), 80));
    document.body.setAttribute('data-bg', t.background || 'aurora');
    document.body.setAttribute('data-grain', t.grain === false ? 'off' : 'on');
    startBg();
  }
  var hostTheme = document.documentElement.getAttribute('data-theme');
  var themePref = store('pf-theme') || (DATA.theme.defaultMode || 'auto');
  function applyTheme(t, save) {
    themePref = t; if (save) store('pf-theme', t);
    var root = document.documentElement;
    if (t === 'auto') { if (hostTheme) root.setAttribute('data-theme', hostTheme); else root.removeAttribute('data-theme'); }
    else root.setAttribute('data-theme', t);
    $$('.seg [data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)); });
    paintBanner(); bgDirty = true; if (!bgRunning) drawBg(performance.now());
  }
  function isDark() {
    var a = document.documentElement.getAttribute('data-theme');
    if (a === 'dark') return true; if (a === 'light') return false;
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { paintBanner(); bgDirty = true; if (!bgRunning) drawBg(performance.now()); }); } catch (e) {}

  // ---------- living background ----------
  var bgCanvas, bgCtx, bgRunning = false, bgDirty = true, bgLast = 0, bgW = 0, bgH = 0;
  var BLOBS = [
    { x: 0.15, y: 0.1, r: 0.55, ax: 0.12, ay: 0.08, sx: 0.00011, sy: 0.00013, p: 0, dh: 0 },
    { x: 0.85, y: 0.15, r: 0.5, ax: 0.1, ay: 0.12, sx: 0.00009, sy: 0.00012, p: 1.7, dh: 38 },
    { x: 0.6, y: 0.75, r: 0.6, ax: 0.14, ay: 0.1, sx: 0.0001, sy: 0.00008, p: 3.1, dh: -42 },
    { x: 0.1, y: 0.85, r: 0.45, ax: 0.1, ay: 0.1, sx: 0.00012, sy: 0.0001, p: 4.4, dh: 160 },
    { x: 0.45, y: 0.35, r: 0.35, ax: 0.18, ay: 0.14, sx: 0.00014, sy: 0.00009, p: 2.2, dh: 18 }
  ];
  function sizeBg() {
    if (!bgCanvas) return;
    bgW = Math.max(2, Math.round(innerWidth / 6)); bgH = Math.max(2, Math.round(innerHeight / 6));
    bgCanvas.width = bgW; bgCanvas.height = bgH; bgDirty = true;
  }
  function drawBg(now) {
    if (!bgCtx) return;
    var style = view.theme.background || 'aurora', dark = isDark();
    var t = (view.theme.animate === false || reduced() || style !== 'aurora') ? 0 : now;
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.clearRect(0, 0, bgW, bgH);
    var list = style === 'minimal' ? [BLOBS[0], BLOBS[1]] : BLOBS;
    var amp = style === 'minimal' ? 0.6 : 1;
    if (dark) bgCtx.globalCompositeOperation = 'lighter';
    list.forEach(function (b, i) {
      var x = bgW * (b.x + Math.sin(t * b.sx + b.p) * b.ax), y = bgH * (b.y + Math.cos(t * b.sy + b.p) * b.ay);
      var r = Math.max(bgW, bgH) * b.r * (style === 'minimal' ? 0.8 : 1);
      var h = accentHue + b.dh, s = Math.min(95, accentSat + 10);
      var g = bgCtx.createRadialGradient(x, y, 0, x, y, r);
      var a = (dark ? 0.32 : 0.42) * amp * (i === 4 ? 0.7 : 1);
      g.addColorStop(0, 'hsla(' + h + ',' + s + '%,' + (dark ? 50 : 72) + '%,' + a + ')');
      g.addColorStop(0.55, 'hsla(' + h + ',' + s + '%,' + (dark ? 40 : 78) + '%,' + a * 0.35 + ')');
      g.addColorStop(1, 'hsla(' + h + ',' + s + '%,' + (dark ? 30 : 85) + '%,0)');
      bgCtx.fillStyle = g; bgCtx.fillRect(0, 0, bgW, bgH);
    });
    bgDirty = false;
  }
  function loop(now) {
    if (!bgRunning) return;
    if (now - bgLast > 50) { bgLast = now; drawBg(now); }
    requestAnimationFrame(loop);
  }
  function startBg() {
    bgCanvas = document.getElementById('bg-canvas'); if (!bgCanvas) return;
    bgCtx = bgCanvas.getContext('2d'); if (!bgW) sizeBg();
    var animate = view.theme.animate !== false && !reduced() && (view.theme.background || 'aurora') === 'aurora' && !document.hidden;
    if (animate && !bgRunning) { bgRunning = true; requestAnimationFrame(loop); }
    if (!animate) { bgRunning = false; drawBg(0); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) bgRunning = false; else startBg(); });

  // ---------- render: page ----------
  function navItems() { return view.sections.filter(function (s) { return s.show !== false && s.nav && hasContent(s.id); }); }
  function renderNav(d) {
    var unread = state.messages.length;
    return '<header class="nav" id="nav"><div class="container nav-inner">' +
      '<a class="brand" href="#top" aria-label="Back to top"><span class="mark">' + esc(d.profile.initials || initials(d.profile.name)) + '</span><span>' + esc(d.profile.name) + '</span></a>' +
      '<nav class="nav-links" aria-label="Sections">' + navItems().slice(0, 7).map(function (s) { return '<a href="#' + s.id + '" data-sec="' + s.id + '">' + esc(s.nav) + '</a>'; }).join('') + '</nav>' +
      '<div class="nav-right">' +
        '<button class="kbd-btn" type="button" data-act="palette" aria-label="Open quick actions">' + ic('search') + '<span class="kbd-label">Search</span><kbd>⌘K</kbd></button>' +
        '<div class="seg" role="group" aria-label="Theme">' +
          '<button type="button" data-theme-set="light" aria-label="Light theme" title="Light">' + ic('sun') + '</button>' +
          '<button type="button" data-theme-set="auto" aria-label="Match system" title="Auto">' + ic('monitor') + '</button>' +
          '<button type="button" data-theme-set="dark" aria-label="Dark theme" title="Dark">' + ic('moon') + '</button>' +
        '</div>' +
        (state.isEditor ? '<button class="btn btn-secondary btn-sm edit-btn" type="button" data-act="edit">' + ic('pencil') + '<span class="edit-label">Edit</span>' + (unread ? '<span class="badge-dot">' + unread + '</span>' : '') + '</button>' : '') +
      '</div></div></header>';
  }
  function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(''); }
  function liveSocials(d) { return (d.socials || []).filter(function (s) { return socialUrl(s) || (s.platform === 'discord' && (s.handle || s.url)); }); }

  function renderHero(d) {
    var p = d.profile;
    var wip = (d.projects || []).map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return statusClass(o.x.status) === 'wip'; })[0];
    var avatarUrl = safeUrl(p.avatar);
    var socials = liveSocials(d).slice(0, 6).map(function (s) {
      var info = platformInfo(s), url = socialUrl(s);
      var style = info.color ? ' style="--brand:' + info.color + '"' : '';
      if (!url) return '<button class="soc-btn' + (info.mono ? ' mono' : '') + '"' + style + ' type="button" data-copy="' + esc(s.handle || s.url) + '" data-copy-label="' + esc(info.name) + ' username" data-tip="' + esc(info.name) + '" aria-label="Copy ' + esc(info.name) + ' username">' + info.html + '</button>';
      return '<a class="soc-btn' + (info.mono ? ' mono' : '') + '"' + style + ' href="' + esc(url) + '" target="_blank" rel="noopener" data-tip="' + esc(info.name) + '" aria-label="' + esc(info.name) + '">' + info.html + '</a>';
    }).join('');
    if (d.contact.email) socials += '<button class="soc-btn mono" type="button" data-copy="' + esc(d.contact.email) + '" data-copy-label="Email" data-tip="Copy email" aria-label="Copy email">' + ic('mail') + '</button>';
    var rot = (p.rotating || []).filter(Boolean);
    var core = []; (d.skills || []).forEach(function (g) { (g.items || []).forEach(function (t) { if (core.indexOf(t) < 0 && techIcon(t).found) core.push(t); }); });
    var workTarget = shown('work') && d.projects.length ? '#work' : '#contact';
    return '<section class="hero" id="top"><div class="container hero-grid">' +
      '<div class="hero-copy">' +
        (p.available && p.availabilityText ? '<span class="chip"><span class="pulse"></span>' + esc(p.availabilityText) + '</span>' : '') +
        '<h1>' + rich(p.headline || p.name) + '</h1>' +
        (rot.length ? '<p class="rotator">' + (p.rotatePrefix ? '<span>' + esc(p.rotatePrefix) + '</span>' : '') + '<span class="rot" aria-live="polite"><span id="rot-word">' + esc(rot[0]) + '</span></span></p>' : '') +
        (p.bio ? '<p class="lede">' + esc(p.bio) + '</p>' : '') +
        '<div class="cta-row"><a class="btn btn-primary" href="' + workTarget + '">' + esc(p.ctaPrimary || 'View my work') + ' ' + ic('right', 'arrow') + '</a>' +
          (shown('contact') ? '<a class="btn btn-secondary" href="#contact">' + esc(p.ctaSecondary || 'Get in touch') + '</a>' : '') +
          (safeUrl(p.resume) ? '<a class="btn btn-ghost" href="' + esc(safeUrl(p.resume)) + '" target="_blank" rel="noopener">' + ic('file') + 'Resume</a>' : '') + '</div>' +
        ((d.stats || []).length ? '<div class="stats">' + d.stats.map(function (s) { return '<div class="stat"><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="card-stage"><aside class="profile-card" id="pcard" aria-label="Profile"><span class="glare"></span>' +
        '<div class="pc-banner"><canvas id="banner" aria-hidden="true"></canvas></div>' +
        '<div class="pc-body">' +
          '<div class="pc-id">' +
          '<div class="avatar">' + (avatarUrl ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(p.name) + '">' : esc(p.initials || initials(p.name))) + '</div>' +
          '<div class="pc-name"><h3>' + esc(p.name) + '</h3><span>' + esc(p.role) + (p.company ? ' at ' + esc(p.company) : '') + '</span></div>' +
          (core.length ? '<div class="pc-core"><span class="pc-label">Core stack</span>' + stackIcons(core, 8) + '</div>' : '') +
          (socials ? '<div class="pc-social">' + socials + '</div>' : '') +
          '</div><div class="pc-meta">' +
          '<dl class="pc-rows">' +
            (p.location ? '<div class="pc-row"><dt>' + ic('pin') + 'Location</dt><dd>' + esc(p.location) + '</dd></div>' : '') +
            '<div class="pc-row"><dt>' + ic('clock') + 'Local time</dt><dd><span data-clock="short">--:--</span> ' + esc(p.tzLabel || '') + '</dd></div>' +
            (p.yearsLabel ? '<div class="pc-row"><dt>' + ic('brief') + 'Experience</dt><dd>' + esc(p.yearsLabel) + '</dd></div>' : '') +
            (p.focus ? '<div class="pc-row"><dt>' + ic('target') + 'Focus</dt><dd>' + esc(p.focus) + '</dd></div>' : '') +
          '</dl>' +
          (wip ? '<button class="now-card" type="button" data-open-project="' + wip.i + '"><span class="lbl">Now</span><span>Building <b>' + esc(wip.x.title) + '</b></span></button>' : '') +
          (p.available && p.availabilityText ? '<div class="pc-avail"><span class="pulse"></span><span>' + esc(p.availabilityText) + '</span>' + (shown('contact') ? '<a class="text-link" href="#contact">Contact ' + ic('arrow') + '</a>' : '') + '</div>' : '') +
        '</div></div>' +
      '</aside></div>' +
    '</div></section>';
  }

  function allTech(d) {
    var all = [];
    (d.skills || []).forEach(function (g) { (g.items || []).forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); }); });
    (d.projects || []).forEach(function (p) { (p.tags || []).forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); }); });
    return all;
  }
  function renderStack(d) {
    var all = allTech(d); if (!all.length) return '';
    var items = all.map(function (t) { return '<span class="tech">' + tiSpan(t) + esc(t) + '</span>'; }).join('');
    return '<div class="stack-strip" id="stack" aria-label="Technologies"><div class="marquee"><div class="marquee-track">' + items + '<span aria-hidden="true" style="display:contents">' + items + '</span></div></div></div>';
  }

  function secHead(id, right) {
    var s = sec(id);
    return '<div class="sec-head"><div>' + (s.eyebrow ? '<span class="eyebrow">' + esc(s.eyebrow) + '</span>' : '') + (s.title ? '<h2>' + rich(s.title) + '</h2>' : '') + (s.subtitle ? '<p>' + esc(s.subtitle) + '</p>' : '') + '</div>' +
      (right || '') + (state.isEditor ? '<button class="btn btn-secondary btn-sm sec-edit" type="button" data-edit-tab="' + TAB_FOR[id] + '">' + ic('pencil') + 'Edit</button>' : '') + '</div>';
  }
  var TAB_FOR = { stack: 'about', about: 'about', work: 'projects', experience: 'experience', testimonials: 'testimonials', achievements: 'achievements', certifications: 'certifications', socials: 'socials', contact: 'contact' };
  function emptyOwner(tab, label) { return state.isEditor ? '<div class="empty-state">' + ic('plus') + '<span>Nothing here yet.</span><button class="btn btn-secondary btn-sm" type="button" data-edit-tab="' + tab + '">' + esc(label) + '</button></div>' : ''; }
  function hasContent(id) {
    var d = view;
    switch (id) {
      case 'stack': return allTech(d).length > 0;
      case 'about': return !!(d.about || d.skills.length || d.learning.length || d.interests.length);
      case 'work': return d.projects.length > 0 || state.isEditor;
      case 'experience': return d.experience.length > 0 || state.isEditor;
      case 'achievements': return d.achievements.length > 0 || state.isEditor;
      case 'testimonials': return d.testimonials.length > 0 || state.isEditor;
      case 'certifications': return d.certifications.length > 0 || state.isEditor;
      case 'socials': return liveSocials(d).length > 0 || state.isEditor;
      case 'contact': return true;
    }
    return true;
  }

  function renderAbout(d) {
    var paras = String(d.about || '').split(/\n\s*\n/).filter(Boolean).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    var n = d.skills.length, span = n === 1 ? 6 : n === 2 ? 3 : n === 4 ? 3 : 2;
    var skills = d.skills.map(function (g, gi) {
      var odd = (n % 2 === 1 && gi === n - 1) ? ' odd-last' : '';
      return '<div class="card spot b-skill' + odd + '" style="--span:' + span + '"><div class="skill-title"><h3>' + esc(g.group) + '</h3><span class="count">' + (g.items || []).length + '</span></div>' +
        '<div class="tools">' + (g.items || []).map(function (s) { var t = techIcon(s); return '<span class="tool"' + (t.color ? ' style="--brand:' + t.color + '"' : '') + '>' + tiSpan(s) + '<span>' + esc(s) + '</span></span>'; }).join('') + '</div></div>';
    }).join('');
    var L = d.learning.length, I = d.interests.length, cls = (L && I) ? 'b-half' : 'b-full';
    var extras = (L ? '<div class="card spot ' + cls + '"><div class="learn-row"><h3>' + ic('spark') + 'Currently learning</h3><div class="pills">' + d.learning.map(function (s) { return '<span class="pill">' + (techIcon(s).found ? tiSpan(s) : '') + esc(s) + '</span>'; }).join('') + '</div></div></div>' : '') +
      (I ? '<div class="card spot ' + cls + '"><div class="learn-row alt"><h3>' + ic('heart') + 'Outside of code</h3><div class="pills">' + d.interests.map(function (s) { return '<span class="pill">' + esc(s) + '</span>'; }).join('') + '</div></div></div>' : '');
    return '<section class="block" id="about"><div class="container">' + secHead('about') +
      '<div class="bento">' +
        (paras ? '<div class="card spot b-about"><span class="card-label">' + ic('user') + 'Who I am</span><div class="about-text">' + paras + '</div></div>' : '') +
        '<div class="card spot b-loc' + (paras ? '' : ' b-full') + '"><span class="card-label">' + ic('pin') + esc(d.profile.location || 'Local time') + '</span><div class="clock"><span data-clock="short">--:--</span><small>' + esc(d.profile.tzLabel || '') + '</small></div><div class="daybar" title="Working hours highlighted"><span id="daydot" style="left:50%"></span></div><div class="loc-meta"><span data-clock="date">&nbsp;</span><span id="work-status">&nbsp;</span></div></div>' +
        skills + extras +
      '</div></div></section>';
  }

  function statusClass(s) { s = String(s || '').toLowerCase(); if (s.indexOf('live') > -1 || s.indexOf('shipped') > -1 || s.indexOf('launch') > -1) return 'live'; if (s.indexOf('progress') > -1 || s.indexOf('wip') > -1 || s.indexOf('building') > -1 || s.indexOf('beta') > -1) return 'wip'; return 'archived'; }
  function coverHtml(p) {
    var img = safeUrl(p.image), h = (+p.hue || 0) % 361;
    if (img) return '<div class="cover" style="--h:' + h + '"><img class="cover-img" src="' + esc(img) + '" alt=""></div>';
    return '<div class="cover" style="--h:' + h + '" aria-hidden="true"><div class="cover-mesh"></div><div class="window"><div class="win-bar"><i></i><i></i><i></i></div><div class="win-body"><div class="win-side"><i></i><i style="width:85%"></i><i style="width:60%"></i><i style="width:75%"></i></div><div class="win-main"><div class="tiles"><b></b><b></b><b></b></div><i style="width:90%"></i><i style="width:70%"></i><i style="width:80%"></i><i style="width:45%"></i></div></div></div></div>';
  }
  function stackIcons(tags, max) {
    tags = tags || []; max = max || 6;
    var shownTags = tags.slice(0, max);
    return '<div class="stack-icons">' + shownTags.map(function (t) { return '<span class="si-tile" data-tip="' + esc(t) + '" role="img" aria-label="' + esc(t) + '">' + tiSpan(t) + '</span>'; }).join('') +
      (tags.length > max ? '<span class="si-tile si-more" data-tip="' + esc(tags.slice(max).join(', ')) + '">+' + (tags.length - max) + '</span>' : '') + '</div>';
  }
  function renderWork(d) {
    return '<section class="block" id="work"><div class="container">' + secHead('work') +
      '<div class="projects">' + (d.projects.length ? d.projects.map(function (p, i) {
        return '<button class="card proj spot" type="button" data-open-project="' + i + '">' + coverHtml(p) +
          '<div class="proj-body"><div class="proj-top"><h3>' + esc(p.title) + '</h3>' + (p.status ? '<span class="status ' + statusClass(p.status) + '">' + esc(p.status) + '</span>' : '') + '</div>' +
          '<p>' + esc(p.summary) + '</p>' +
          '<div class="proj-foot">' + stackIcons(p.tags) + '<span class="proj-year">' + esc(p.year || '') + '</span></div></div></button>';
      }).join('') : emptyOwner('projects', 'Add a project')) + '</div></div></section>';
  }

  function renderExperience(d) {
    var jobs = d.experience;
    return '<section class="block" id="experience"><div class="container">' + secHead('experience') +
      (jobs.length ? '<div class="timeline">' + jobs.map(function (j, i) {
        var current = /present|now|current/i.test(j.end || '');
        var pts = j.points || [];
        var open = state.expanded[i] != null ? state.expanded[i] : i === 0;
        return '<div class="job' + (current ? ' current' : '') + '">' +
          '<div class="job-when"><b>' + esc(j.start) + (j.end ? ' – ' + esc(j.end) : '') + '</b><span>' + esc(j.type || '') + '</span></div>' +
          '<div class="job-rail"><span class="job-dot"></span></div>' +
          '<div class="card spot job-card"><div class="job-head"><div><h3>' + esc(j.role) + '</h3><div class="co">' + esc(j.company) + (j.location ? '<span aria-hidden="true">·</span>' + esc(j.location) : '') + '</div></div>' + (current ? '<span class="status live">Current</span>' : '') + '</div>' +
          (j.summary ? '<p>' + esc(j.summary) + '</p>' : '') +
          (pts.length ? (open ? '<ul class="bullets">' + pts.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
            '<button class="toggle-more" type="button" data-expand="' + i + '" aria-expanded="' + open + '">' + (open ? 'Show less' : 'Show ' + pts.length + ' highlights') + ic('chev') + '</button>' : '') +
          '</div></div>';
      }).join('') + '</div>' : emptyOwner('experience', 'Add experience')) + '</div></section>';
  }

  function liUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; if (/linkedin\.com/i.test(u)) return 'https://' + u.replace(/^\/+/, ''); return 'https://www.linkedin.com/in/' + u.replace(/^@/, ''); }
  function quoteCard(t, i, featured) {
    var long = String(t.quote || '').length > (featured ? 520 : 300), open = state.qopen[i];
    var av = safeUrl(t.avatar), li = liUrl(t.linkedin);
    var who = [t.title, t.company].filter(Boolean).join(' · ');
    return '<figure class="card spot quote-card' + (featured ? ' featured' : '') + '">' +
      '<svg class="qmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14.4C0 6.4 4.8 1.6 12.8 0l1.6 3.2C9.6 4.8 7.2 8 7.2 12h6.4v12H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 30.4 0L32 3.2c-4.8 1.6-7.2 4.8-7.2 8.8h6.4v12H17.6z"/></svg>' +
      '<blockquote class="' + (long && !open ? 'clamp' : '') + '">' + esc(t.quote || '') + '</blockquote>' +
      (long ? '<button class="toggle-more" type="button" data-qopen="' + i + '" aria-expanded="' + !!open + '">' + (open ? 'Show less' : 'Read more') + ic('chev') + '</button>' : '') +
      '<figcaption><span class="q-av">' + (av ? '<img src="' + esc(av) + '" alt="">' : esc(initials(t.name))) + '</span>' +
        '<span class="q-who"><b>' + esc(t.name) + '</b>' + (who ? '<span>' + esc(who) + '</span>' : '') + ((t.relation || t.date) ? '<small>' + esc([t.relation, t.date].filter(Boolean).join(' · ')) + '</small>' : '') + '</span>' +
        (li ? '<a class="soc-btn q-li" style="--brand:#0A66C2" href="' + esc(li) + '" target="_blank" rel="noopener" aria-label="' + esc(t.name) + ' on LinkedIn" data-tip="View on LinkedIn">' + techIcon('linkedin').html + '</a>' : '') +
      '</figcaption></figure>';
  }
  function renderTestimonials(d) {
    var list = d.testimonials.map(function (t, i) { return { t: t, i: i }; });
    var feat = list.filter(function (o) { return o.t.featured; })[0] || (list.length >= 3 ? list[0] : null);
    var rest = list.filter(function (o) { return o !== feat; });
    var mine = (d.socials || []).filter(function (s) { return s.platform === 'linkedin' && socialUrl(s); })[0];
    var allLink = mine && /linkedin\.com\/in\//i.test(socialUrl(mine)) ? socialUrl(mine).replace(/\/+$/, '') + '/details/recommendations/' : '';
    var right = allLink ? '<a class="btn btn-secondary btn-sm" href="' + esc(allLink) + '" target="_blank" rel="noopener">' + tiSpan('linkedin') + 'All recommendations ' + ic('arrow', 'arrow') + '</a>' : '';
    var body;
    if (!list.length) {
      body = state.isEditor ? '<div class="quote-ghost"><figure class="card quote-card"><svg class="qmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M0 24V14.4C0 6.4 4.8 1.6 12.8 0l1.6 3.2C9.6 4.8 7.2 8 7.2 12h6.4v12H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 30.4 0L32 3.2c-4.8 1.6-7.2 4.8-7.2 8.8h6.4v12H17.6z"/></svg><blockquote>Their recommendation appears here, with their name, role, company and a LinkedIn button visitors can click.</blockquote><figcaption><span class="q-av">AB</span><span class="q-who"><b>Person\u2019s name</b><span>Role · Company</span><small>Only you can see this preview</small></span><span class="soc-btn q-li" style="--brand:#0A66C2">' + techIcon('linkedin').html + '</span></figcaption></figure>' +
        '<div class="empty-state">' + ic('plus') + '<span>Paste feedback from clients, managers or teammates.</span><button class="btn btn-secondary btn-sm" type="button" data-edit-tab="testimonials">Add a testimonial</button></div></div>' : '';
    } else {
      body = (feat ? quoteCard(feat.t, feat.i, true) : '') + (rest.length ? '<div class="quotes' + (rest.length < 3 ? ' few' : '') + '" style="--n:' + rest.length + '">' + rest.map(function (o) { return quoteCard(o.t, o.i, false); }).join('') + '</div>' : '');
    }
    return '<section class="block" id="testimonials"><div class="container">' + secHead('testimonials', right) + body + '</div></section>';
  }
  function renderAchievements(d) {
    var icons = { gold: 'trophy', silver: 'medal', bronze: 'medal', accent: 'star' };
    return '<section class="block" id="achievements"><div class="container">' + secHead('achievements') +
      '<div class="awards">' + (d.achievements.length ? d.achievements.map(function (a) {
        var m = a.medal || 'accent', link = safeUrl(a.link);
        return '<div class="card spot award"><div class="award-top"><span class="medal ' + esc(m) + '">' + ic(icons[m] || 'award') + '</span>' + (a.badge ? '<span class="award-badge">' + esc(a.badge) + '</span>' : '') + '</div>' +
          '<div><h3>' + esc(a.title) + '</h3><div class="meta">' + (a.org ? '<span>' + esc(a.org) + '</span>' : '') + (a.org && a.date ? '<span aria-hidden="true">·</span>' : '') + (a.date ? '<span>' + esc(a.date) + '</span>' : '') + '</div></div>' +
          (a.description ? '<p>' + esc(a.description) + '</p>' : '') +
          (link ? '<a class="text-link" href="' + esc(link) + '" target="_blank" rel="noopener">View details ' + ic('arrow') + '</a>' : '') + '</div>';
      }).join('') : emptyOwner('achievements', 'Add an achievement')) + '</div></div></section>';
  }

  function renderCerts(d) {
    return '<section class="block" id="certifications"><div class="container">' + secHead('certifications') +
      '<div class="certs">' + (d.certifications.length ? d.certifications.map(function (c) {
        var link = safeUrl(c.link), t = techIcon(c.icon || c.issuer);
        return '<div class="card spot cert"><span class="cert-logo">' + (t.found ? tiSpan(c.icon || c.issuer) : '<span class="ti" style="color:var(--accent)">' + ic('badge') + '</span>') + '</span>' +
          '<div class="cert-info"><h3>' + esc(c.name) + '</h3><span class="issuer">' + esc(c.issuer) + '</span><div class="meta">' + (c.date ? '<span>Issued ' + esc(c.date) + '</span>' : '') +
            (c.credentialId ? '<button type="button" data-copy="' + esc(c.credentialId) + '" data-copy-label="Credential ID" title="Copy credential ID">ID ' + esc(c.credentialId) + ' ' + ic('copy') + '</button>' : '') + (link ? '<span class="verified">' + ic('badge') + 'Verifiable</span>' : '') + '</div></div>' +
          (link ? '<a class="btn btn-secondary btn-sm cert-act" href="' + esc(link) + '" target="_blank" rel="noopener">Verify ' + ic('arrow', 'arrow') + '</a>' : '<span class="cert-act"></span>') + '</div>';
      }).join('') : emptyOwner('certifications', 'Add a certification')) + '</div></div></section>';
  }

  function renderSocials(d) {
    var list = state.isEditor ? d.socials : liveSocials(d);
    return '<section class="block" id="socials"><div class="container">' + secHead('socials') +
      '<div class="socials">' + (list.length ? list.map(function (s) {
        var info = platformInfo(s), url = socialUrl(s), handle = socialHandle(s), empty = !url && !(s.platform === 'discord' && (s.handle || s.url));
        var style = info.color ? ' style="--brand:' + info.color + '"' : '';
        var inner = '<div class="social-top"><span class="social-ico ti' + (info.mono ? ' mono' : '') + '">' + info.html + '</span><span class="go">' + (url ? ic('arrow') : ic('copy')) + '</span></div>' +
          '<div><h3>' + esc(info.name) + '</h3><div class="handle">' + (empty ? 'Add your link in Edit' : esc(handle || url)) + '</div></div>' +
          (s.description ? '<p>' + esc(s.description) + '</p>' : '') +
          (s.metric ? '<div class="metric">' + ic('users') + '<b>' + esc(s.metric) + '</b></div>' : '');
        if (empty) return '<button class="card social placeholder" type="button" data-edit-tab="socials"' + style + '>' + inner + '</button>';
        if (url) return '<a class="card spot social" href="' + esc(url) + '" target="_blank" rel="noopener"' + style + '>' + inner + '</a>';
        return '<button class="card spot social" type="button" data-copy="' + esc(s.handle || s.url) + '" data-copy-label="' + esc(info.name) + ' username"' + style + '>' + inner + '</button>';
      }).join('') : emptyOwner('socials', 'Add a profile')) + '</div></div></section>';
  }

  function channel(kind, icon, label, value, opts) {
    opts = opts || {};
    if (!value && !state.isEditor) return '';
    var href = kind === 'address' && value ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(value) : '';
    var actions = '';
    if (value) {
      actions += '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-copy="' + esc(value) + '" data-copy-label="' + esc(label) + '" aria-label="Copy ' + esc(label) + '" data-tip="Copy">' + ic('copy') + '</button>';
      if (href) actions += '<a class="btn btn-ghost btn-icon btn-sm" href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="Open in maps" data-tip="Open map">' + ic('arrow') + '</a>';
    }
    var icoHtml = icon.charAt(0) === '@' ? tiSpan(icon.slice(1)) : ic(icon);
    return '<div class="card spot channel' + (opts.wide ? ' wide' : '') + '"><div class="ch-top"><span class="ch-ico">' + icoHtml + '</span><div class="ch-actions">' + actions + '</div></div>' +
      '<div><div class="ch-label">' + esc(label) + '</div><div class="ch-value' + (value ? '' : ' placeholder') + '">' + (value ? esc(value) : 'Add in Edit › Contact') + '</div></div></div>';
  }
  function renderContact(d) {
    var c = d.contact;
    var items = [['email', 'mail', 'Email', c.email], ['phone', 'phone', 'Phone', c.phone], ['discord', '@discord', 'Discord', c.discord], ['address', 'pin', 'Address', c.address]]
      .filter(function (x) { return x[3] || state.isEditor; });
    var chans = items.map(function (x, i) { return channel(x[0], x[1], x[2], x[3], { wide: i === 0 || (items.length % 2 === 0 && i === items.length - 1) }); }).join('');
    var form = '';
    if (c.form !== false) {
      if (state.sent) {
        form = '<div class="card form-card"><div class="sent"><span class="ok-ico">' + ic('check') + '</span><h3>Message sent</h3><p style="color:var(--text-2)">Thanks for reaching out. ' + esc(c.note || '') + '</p><button class="btn btn-secondary btn-sm" type="button" data-act="another">Send another message</button></div></div>';
      } else {
        var canSend = !!(state.db && state.user);
        form = '<form class="card form-card" id="contact-form" novalidate><h3>Send a message</h3><p>' + esc(c.note || 'I will get back to you soon.') + '</p>' +
          '<div class="row-2"><div class="field"><label for="cf-name">Name</label><input class="input" id="cf-name" name="name" autocomplete="name" placeholder="Your name" required></div>' +
          '<div class="field"><label for="cf-email">Email or Discord</label><input class="input" id="cf-email" name="email" autocomplete="email" placeholder="How can I reply?" required></div></div>' +
          '<div class="field"><label for="cf-topic">Topic</label><select class="input" id="cf-topic" name="topic"><option>Project inquiry</option><option>Job opportunity</option><option>Collaboration</option><option>Just saying hi</option></select></div>' +
          '<div class="field"><label for="cf-msg">Message</label><textarea class="textarea" id="cf-msg" name="message" placeholder="Tell me a little about what you have in mind" required></textarea></div>' +
          '<div class="form-foot"><span class="form-note" id="cf-note">' + (canSend ? 'Your message goes straight to my inbox.' : 'Sign in to Claude to send a message, or use the channels on the left.') + '</span>' +
          '<button class="btn btn-primary" type="submit" ' + (canSend && !state.sending ? '' : 'disabled') + '><span>' + (state.sending ? 'Sending…' : 'Send message') + '</span>' + ic('send') + '</button></div></form>';
      }
    }
    return '<section class="block" id="contact"><div class="container">' + secHead('contact') +
      '<div class="contact-grid"' + (form ? '' : ' style="grid-template-columns:minmax(0,1fr)"') + '><div class="channels">' + chans + '</div>' + form + '</div></div></section>';
  }

  function renderFooter(d) {
    return '<footer class="footer"><div class="container footer-inner"><span>© ' + new Date().getFullYear() + ' ' + esc(d.profile.name) + (d.profile.footer ? '. ' + esc(d.profile.footer) : '') + '</span>' +
      '<div class="footer-links">' + navItems().slice(0, 5).map(function (s) { return '<a href="#' + s.id + '">' + esc(s.nav) + '</a>'; }).join('') + '<a href="#top">Back to top ↑</a></div></div></footer>';
  }

  var RENDER = { stack: renderStack, about: renderAbout, work: renderWork, experience: renderExperience, testimonials: renderTestimonials, achievements: renderAchievements, certifications: renderCerts, socials: renderSocials, contact: renderContact };
  function renderSection(id) { if (!shown(id) || !hasContent(id)) return ''; return RENDER[id](view); }
  function renderPage() {
    var d = view, y = window.scrollY;
    var sample = d.sample && state.isEditor ? '<div class="sample-bar">This portfolio is showing sample content. <button type="button" data-act="edit">Replace it with your details</button></div>' : '';
    $('#page').innerHTML = sample + renderNav(d) + '<main>' + renderHero(d) + d.sections.map(function (s) { return renderSection(s.id); }).join('') + '</main>' + renderFooter(d);
    applyTheme(themePref);
    tickClock(); paintBanner(); observeSections(); onScroll(); startRotator();
    window.scrollTo(0, y);
  }
  function rerenderSection(id) {
    var el = document.getElementById(id); var y = window.scrollY;
    if (el) { var html = renderSection(id); if (html) el.outerHTML = html; else el.remove(); window.scrollTo(0, y); observeSections(); }
  }

  // ---------- rotator ----------
  var rotTimer, rotIdx = 0;
  function startRotator() {
    clearInterval(rotTimer);
    var words = (view.profile.rotating || []).filter(Boolean); if (words.length < 2) return;
    rotIdx = 0;
    rotTimer = setInterval(function () {
      var el = document.getElementById('rot-word'); if (!el) return;
      if (reduced()) { rotIdx = (rotIdx + 1) % words.length; el.textContent = words[rotIdx]; return; }
      el.classList.add('out');
      setTimeout(function () {
        rotIdx = (rotIdx + 1) % words.length; el.textContent = words[rotIdx];
        el.classList.remove('out'); el.classList.add('in'); void el.offsetWidth; el.classList.remove('in');
      }, 420);
    }, 2800);
  }

  // ---------- banner ----------
  function paintBanner() {
    var cv = document.getElementById('banner'); if (!cv) return;
    var r = cv.getBoundingClientRect(); if (!r.width) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var cs = getComputedStyle(document.documentElement);
    var a = cs.getPropertyValue('--accent').trim() || '#2b59e8', b = cs.getPropertyValue('--accent-2').trim() || '#6b5cf0';
    var g = ctx.createLinearGradient(0, 0, r.width, r.height); g.addColorStop(0, b); g.addColorStop(1, a);
    ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
    for (var k = 0; k < 16; k++) {
      ctx.beginPath();
      for (var x = 0; x <= r.width; x += 6) {
        var y = r.height * 0.1 + k * 8 + Math.sin(x / 38 + k * 0.6) * 8 + Math.cos(x / 91 + k) * 6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // ---------- clock ----------
  function tickClock() {
    var tz = view.profile.timezone || 'Asia/Kolkata', now = new Date(), short, date, hour = 12, min = 0;
    try {
      short = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now);
      date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(now);
      var parts = short.split(':'); hour = +parts[0]; min = +parts[1];
    } catch (e) { short = now.toTimeString().slice(0, 5); date = now.toDateString(); }
    $$('[data-clock="short"]').forEach(function (el) { el.textContent = short; });
    $$('[data-clock="date"]').forEach(function (el) { el.textContent = date; });
    var dot = document.getElementById('daydot'); if (dot) dot.style.left = (((hour * 60 + min) / 1440) * 100).toFixed(2) + '%';
    var ws = document.getElementById('work-status');
    if (ws) ws.textContent = (hour >= 9 && hour < 18) ? 'Working hours now, expect a quick reply' : 'Outside working hours, I will reply soon';
  }
  setInterval(tickClock, 15000);

  // ---------- nav observers ----------
  var io = null;
  function observeSections() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) $$('.nav-links a').forEach(function (a) { a.classList.toggle('active', a.dataset.sec === e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    view.sections.forEach(function (s) { var el = document.getElementById(s.id); if (el) io.observe(el); });
  }
  function onScroll() { var n = document.getElementById('nav'); if (n) n.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { paintBanner(); sizeBg(); if (!bgRunning) drawBg(0); }, 120); });

  // spotlight + tilt
  var fine = true; try { fine = matchMedia('(pointer: fine)').matches; } catch (e) {}
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.spot');
    if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    var pc = e.target.closest && e.target.closest('#pcard');
    if (pc && fine && !reduced()) {
      var b = pc.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
      pc.classList.add('tilting');
      pc.style.setProperty('--ry', ((px - 0.5) * 8).toFixed(2) + 'deg'); pc.style.setProperty('--rx', ((0.5 - py) * 8).toFixed(2) + 'deg');
      pc.style.setProperty('--gx', (px * 100) + '%'); pc.style.setProperty('--gy', (py * 100) + '%');
    }
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    var pc = e.target.closest && e.target.closest('#pcard');
    if (pc && !pc.contains(e.relatedTarget)) { pc.classList.remove('tilting'); pc.style.setProperty('--rx', '0deg'); pc.style.setProperty('--ry', '0deg'); }
  });

  // ---------- toast & copy ----------
  var tt;
  function toast(msg) { var t = $('#toast'); t.innerHTML = ic('check') + '<span>' + esc(msg) + '</span>'; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function copyText(text, label) {
    var done = function () { toast((label || 'Text') + ' copied'); };
    try { navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, label); }); } catch (e) { fallbackCopy(text, label); }
  }
  function fallbackCopy(text, label) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); toast(ok ? (label || 'Text') + ' copied' : 'Select and copy: ' + text);
  }

  // ---------- overlays ----------
  var lastFocus = null;
  function openOverlay() { var o = $('#overlay'); o.hidden = false; requestAnimationFrame(function () { o.classList.add('open'); }); }
  function closeOverlay() { var o = $('#overlay'); o.classList.remove('open'); setTimeout(function () { if (!o.classList.contains('open')) o.hidden = true; }, 300); }
  function anyOpen() { return ['#modal', '#palette', '#drawer'].some(function (s) { return $(s).classList.contains('open'); }); }
  function openProject(i) {
    var p = view.projects[i]; if (!p) return;
    lastFocus = document.activeElement;
    var link = safeUrl(p.link), repo = safeUrl(p.repo), m = $('#modal');
    m.innerHTML = '<button class="btn btn-icon modal-close" type="button" data-act="close" aria-label="Close">' + ic('x') + '</button>' + coverHtml(p) +
      '<div class="modal-body"><div class="proj-top"><h2 id="modal-title">' + esc(p.title) + '</h2>' + (p.status ? '<span class="status ' + statusClass(p.status) + '">' + esc(p.status) + '</span>' : '') + '</div>' +
      '<p>' + esc(p.details || p.summary) + '</p>' +
      '<div class="modal-meta"><div><span>Role</span><b>' + esc(p.role || '—') + '</b></div><div><span>Year</span><b>' + esc(p.year || '—') + '</b></div></div>' +
      ((p.tags || []).length ? '<div style="display:flex;flex-direction:column;gap:.6rem"><h4>Built with</h4><div class="pills">' + p.tags.map(function (t) { return '<span class="pill">' + tiSpan(t) + esc(t) + '</span>'; }).join('') + '</div></div>' : '') +
      ((p.highlights || []).length ? '<div style="display:flex;flex-direction:column;gap:.6rem"><h4>Highlights</h4><ul class="bullets" style="margin:0">' + p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div>' : '') +
      ((link || repo) ? '<div class="cta-row">' + (link ? '<a class="btn btn-primary" href="' + esc(link) + '" target="_blank" rel="noopener">Visit project ' + ic('arrow', 'arrow') + '</a>' : '') + (repo ? '<a class="btn btn-secondary" href="' + esc(repo) + '" target="_blank" rel="noopener">' + tiSpan('github') + 'Source code</a>' : '') + '</div>' : '') +
      '</div>';
    m.hidden = false; openOverlay();
    requestAnimationFrame(function () { m.classList.add('open'); $('.modal-close', m).focus(); });
  }
  function closeModal() { var m = $('#modal'); if (!m.classList.contains('open')) return; m.classList.remove('open'); setTimeout(function () { m.hidden = true; }, 350); if (!$('#drawer').classList.contains('open')) closeOverlay(); if (lastFocus) lastFocus.focus(); }

  // ---------- palette ----------
  var palSel = 0, palItems = [];
  function palActions() {
    var c = view.contact, a = [];
    a.push({ g: 'Navigate', label: 'Top', icon: ic('up'), run: function () { go('top'); } });
    navItems().forEach(function (s) { a.push({ g: 'Navigate', label: s.nav, icon: ic('hash'), run: function () { go(s.id); } }); });
    view.projects.forEach(function (p, i) { a.push({ g: 'Projects', label: p.title, icon: ic('code'), run: function () { openProject(i); } }); });
    if (c.email) a.push({ g: 'Contact', label: 'Copy email address', icon: ic('mail'), run: function () { copyText(c.email, 'Email'); } });
    if (c.discord) a.push({ g: 'Contact', label: 'Copy Discord username', icon: tiSpan('discord'), run: function () { copyText(c.discord, 'Discord username'); } });
    liveSocials(view).forEach(function (s) { var info = platformInfo(s), url = socialUrl(s); if (url) a.push({ g: 'Social', label: 'Open ' + info.name, icon: '<span class="ti">' + info.html + '</span>', href: url }); });
    if (safeUrl(view.profile.resume)) a.push({ g: 'Contact', label: 'Open resume', icon: ic('file'), href: safeUrl(view.profile.resume) });
    a.push({ g: 'Theme', label: 'Light theme', icon: ic('sun'), run: function () { applyTheme('light', true); } });
    a.push({ g: 'Theme', label: 'Dark theme', icon: ic('moon'), run: function () { applyTheme('dark', true); } });
    a.push({ g: 'Theme', label: 'Match system theme', icon: ic('monitor'), run: function () { applyTheme('auto', true); } });
    if (state.isEditor) {
      a.push({ g: 'Owner', label: 'Edit portfolio', icon: ic('pencil'), run: function () { openDrawer(); } });
      a.push({ g: 'Owner', label: 'Change colors and background', icon: ic('palette'), run: function () { openDrawer('appearance'); } });
      a.push({ g: 'Owner', label: 'Reorder or hide sections', icon: ic('layout'), run: function () { openDrawer('layout'); } });
      a.push({ g: 'Owner', label: 'View messages', icon: ic('inbox'), run: function () { openDrawer('messages'); } });
    }
    return a;
  }
  function go(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }
  function openPalette() { lastFocus = document.activeElement; var p = $('#palette'); p.hidden = false; openOverlay(); $('#pal-q').value = ''; palSel = 0; renderPal(); requestAnimationFrame(function () { p.classList.add('open'); $('#pal-q').focus(); }); }
  function closePalette() { var p = $('#palette'); if (!p.classList.contains('open')) return; p.classList.remove('open'); setTimeout(function () { p.hidden = true; }, 200); if (!$('#drawer').classList.contains('open') && !$('#modal').classList.contains('open')) closeOverlay(); }
  function renderPal() {
    var q = $('#pal-q').value.trim().toLowerCase();
    palItems = palActions().filter(function (a) { return !q || a.label.toLowerCase().indexOf(q) > -1 || a.g.toLowerCase().indexOf(q) > -1; });
    if (palSel >= palItems.length) palSel = Math.max(0, palItems.length - 1);
    var html = '', g = '';
    palItems.forEach(function (a, i) {
      if (a.g !== g) { g = a.g; html += '<div class="pal-group">' + esc(g) + '</div>'; }
      var inner = a.icon + '<span>' + esc(a.label) + '</span>';
      html += a.href ? '<a class="pal-item' + (i === palSel ? ' sel' : '') + '" data-pal="' + i + '" href="' + esc(a.href) + '" target="_blank" rel="noopener" role="option">' + inner + '</a>'
                     : '<button class="pal-item' + (i === palSel ? ' sel' : '') + '" type="button" data-pal="' + i + '" role="option">' + inner + '</button>';
    });
    $('#pal-list').innerHTML = html || '<div class="pal-empty">No matching actions</div>';
    var sel = $('.pal-item.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  function runPal(i) { var a = palItems[i]; if (!a) return; closePalette(); if (!a.href) setTimeout(a.run, 60); }

  // ---------- admin ----------
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, draft); }
  function set(path, val) { var ks = path.split('.'), o = draft; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }
  function fid(path) { return 'ed-' + path.replace(/\./g, '-'); }
  function iconPreview(list) { return (list || []).map(function (s) { var t = techIcon(s); return '<span class="pill' + (t.found ? '' : ' miss') + '" title="' + (t.found ? 'Icon found' : 'No icon found, a monogram is shown') + '">' + tiSpan(s) + esc(s) + '</span>'; }).join(''); }
  // field spec: {k, l, t: text|area|lines|comma|icons|hue|upload|select|bool|color, ph, hint, opts, half}
  function field(path, f) {
    var v = get(path), id = fid(path), t = f.t || 'text', input = '';
    var hint = f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '';
    if (t === 'bool') return '<label class="switch"><input type="checkbox" id="' + id + '" data-path="' + path + '" data-bool="1"' + (v !== false && v ? ' checked' : '') + '>' + esc(f.l) + '</label>';
    if (t === 'upload') {
      var url = safeUrl(v);
      return '<div class="field"><label>' + esc(f.l) + '</label><div class="upload-row"><span class="thumb">' + (url ? '<img src="' + esc(url) + '" alt="">' : 'None') + '</span>' +
        (state.assets ? '<label class="btn btn-secondary btn-sm" style="cursor:pointer">' + ic('upload') + 'Upload image<input type="file" accept="image/*" data-upload="' + path + '" hidden></label>' : '<span class="hint">Image uploads are not available in this view.</span>') +
        (url ? '<button class="btn btn-ghost btn-sm" type="button" data-clear="' + path + '">Remove</button>' : '') + '</div>' + hint + '</div>';
    }
    if (t === 'hue') return '<div class="field"><label for="' + id + '">' + esc(f.l) + '</label><div class="hue-row"><span class="hue-dot" id="dot-' + id + '" style="--h:' + (+v || 0) + '"></span><input type="range" min="0" max="360" id="' + id + '" data-path="' + path + '" data-num="1" value="' + (+v || 0) + '"></div></div>';
    if (t === 'select') input = '<select class="input" id="' + id + '" data-path="' + path + '">' + f.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (t === 'area' || t === 'lines') input = '<textarea class="textarea" id="' + id + '" data-path="' + path + '"' + (t === 'lines' ? ' data-list="lines"' : '') + ' rows="' + (f.rows || 3) + '" placeholder="' + esc(f.ph || '') + '" style="min-height:auto">' + esc(t === 'lines' ? (v || []).join('\n') : v) + '</textarea>';
    else if (t === 'comma' || t === 'icons') input = '<input class="input" id="' + id + '" data-path="' + path + '" data-list="comma"' + (t === 'icons' ? ' data-icons="1"' : '') + ' value="' + esc((v || []).join(', ')) + '" placeholder="' + esc(f.ph || '') + '">' + (t === 'icons' ? '<div class="icon-prev" id="prev-' + id + '">' + iconPreview(v) + '</div>' : '');
    else input = '<input class="input" id="' + id + '" data-path="' + path + '" value="' + esc(v) + '" placeholder="' + esc(f.ph || '') + '">';
    return '<div class="field"><label for="' + id + '">' + esc(f.l) + '</label>' + input + hint + '</div>';
  }
  function fields(base, list) {
    var out = '', buf = [];
    list.forEach(function (f) {
      var html = field(base ? base + '.' + f.k : f.k, f);
      if (f.half) { buf.push(html); if (buf.length === 2) { out += '<div class="row-2">' + buf.join('') + '</div>'; buf = []; } }
      else { if (buf.length) { out += '<div class="row-2">' + buf.join('') + '<div></div></div>'; buf = []; } out += html; }
    });
    if (buf.length) out += '<div class="row-2">' + buf.join('') + '<div></div></div>';
    return out;
  }
  var PLATFORM_OPTS = Object.keys(PLATFORMS).map(function (k) { return [k, PLATFORMS[k].n]; });
  var LISTS = {
    stats: { add: 'Add stat', title: function (s) { return s.value + ' ' + s.label; }, f: [{ k: 'value', l: 'Value', half: 1 }, { k: 'label', l: 'Label', half: 1 }], tpl: function () { return { value: '0', label: 'New stat' }; } },
    skills: { add: 'Add skill group', title: function (s) { return s.group; }, f: [{ k: 'group', l: 'Group name' }, { k: 'items', l: 'Skills', t: 'icons', hint: 'Separate with commas. Icons are matched by name automatically.' }], tpl: function () { return { group: 'New group', items: [] }; } },
    projects: { add: 'Add project', title: function (p) { return p.title; }, f: [
      { k: 'title', l: 'Title', half: 1 }, { k: 'status', l: 'Status', half: 1, hint: 'Live, In progress, Archived…' },
      { k: 'summary', l: 'Card summary', t: 'area', rows: 2 }, { k: 'details', l: 'Full description', t: 'area', rows: 4 },
      { k: 'highlights', l: 'Highlights', t: 'lines', hint: 'One per line' }, { k: 'tags', l: 'Tech stack', t: 'icons', hint: 'Shown as icons on the card' },
      { k: 'role', l: 'Your role', half: 1 }, { k: 'year', l: 'Year', half: 1 }, { k: 'link', l: 'Live link', ph: 'https://', half: 1 }, { k: 'repo', l: 'Source link', ph: 'https://github.com/…', half: 1 },
      { k: 'hue', l: 'Cover color', t: 'hue' }, { k: 'image', l: 'Cover image (optional)', t: 'upload', hint: 'Replaces the generated cover' }],
      tpl: function () { return { title: 'New project', summary: '', details: '', highlights: [], tags: [], status: 'In progress', year: String(new Date().getFullYear()), role: '', link: '', repo: '', hue: Math.floor(Math.random() * 360), image: '' }; } },
    experience: { add: 'Add entry', title: function (j) { return j.role + (j.company ? ' · ' + j.company : ''); }, f: [
      { k: 'role', l: 'Role or degree', half: 1 }, { k: 'company', l: 'Company or school', half: 1 }, { k: 'start', l: 'Start', half: 1 }, { k: 'end', l: 'End', half: 1, hint: 'Write "Present" for a current role' },
      { k: 'type', l: 'Type', half: 1, hint: 'Full-time, Internship, Education…' }, { k: 'location', l: 'Location', half: 1 }, { k: 'summary', l: 'Summary', t: 'area', rows: 2 }, { k: 'points', l: 'Highlights', t: 'lines', hint: 'One per line' }],
      tpl: function () { return { role: 'New role', company: '', type: 'Full-time', start: '', end: 'Present', location: '', summary: '', points: [] }; } },
    testimonials: { add: 'Add testimonial', title: function (t) { return t.name + (t.company ? ' · ' + t.company : ''); }, f: [
      { k: 'name', l: 'Their name', half: 1 }, { k: 'title', l: 'Their role', half: 1, ph: 'Engineering Manager' },
      { k: 'company', l: 'Company', half: 1 }, { k: 'relation', l: 'How you worked together', half: 1, ph: 'Client, Manager, Teammate…' },
      { k: 'quote', l: 'What they said', t: 'area', rows: 5, hint: 'Paste their recommendation. Long quotes get a Read more toggle.' },
      { k: 'linkedin', l: 'Their LinkedIn', half: 1, ph: 'linkedin.com/in/… or username' }, { k: 'date', l: 'Date', half: 1, ph: 'Mar 2026' },
      { k: 'avatar', l: 'Their photo (optional)', t: 'upload', hint: 'Initials are shown when there is no photo' }, { k: 'featured', l: 'Feature this one at the top', t: 'bool' }],
      tpl: function () { return { name: 'New person', title: '', company: '', relation: 'Client', quote: '', linkedin: '', date: '', avatar: '', featured: false }; } },
    achievements: { add: 'Add achievement', title: function (a) { return a.title; }, f: [
      { k: 'title', l: 'Title' }, { k: 'org', l: 'Event or organisation', half: 1 }, { k: 'date', l: 'Date', half: 1 },
      { k: 'badge', l: 'Badge text', half: 1, hint: 'e.g. 1st place, Finalist' }, { k: 'medal', l: 'Icon style', t: 'select', half: 1, opts: [['gold', 'Gold trophy'], ['silver', 'Silver medal'], ['bronze', 'Bronze medal'], ['accent', 'Star (accent color)']] },
      { k: 'description', l: 'Description', t: 'area', rows: 2 }, { k: 'link', l: 'Link (optional)', ph: 'https://' }],
      tpl: function () { return { title: 'New achievement', org: '', date: String(new Date().getFullYear()), badge: '', medal: 'gold', description: '', link: '' }; } },
    certifications: { add: 'Add certification', title: function (c) { return c.name; }, f: [
      { k: 'name', l: 'Certificate name' }, { k: 'issuer', l: 'Issuer', half: 1 }, { k: 'icon', l: 'Logo', half: 1, hint: 'Brand name for the logo, e.g. aws, google, coursera' },
      { k: 'date', l: 'Issued', half: 1 }, { k: 'credentialId', l: 'Credential ID', half: 1 }, { k: 'link', l: 'Verification link', ph: 'https://' }],
      tpl: function () { return { name: 'New certification', issuer: '', icon: '', date: '', credentialId: '', link: '' }; } },
    socials: { add: 'Add profile', title: function (s) { return (PLATFORMS[s.platform] || PLATFORMS.other).n + (s.handle ? ' · ' + s.handle : ''); }, f: [
      { k: 'platform', l: 'Platform', t: 'select', opts: PLATFORM_OPTS, half: 1 }, { k: 'url', l: 'Profile link or username', half: 1, ph: 'https://… or yourname' },
      { k: 'handle', l: 'Display handle (optional)', half: 1, ph: '@yourname' }, { k: 'metric', l: 'Stat (optional)', half: 1, ph: '1.2k followers' }, { k: 'description', l: 'What people find there' }],
      tpl: function () { return { platform: 'website', url: '', handle: '', description: '', metric: '' }; } }
  };
  function listEditor(kind) {
    var cfg = LISTS[kind], arr = draft[kind] || [];
    return arr.map(function (item, i) {
      return '<div class="ed-item"><div class="ed-item-head"><b>' + esc(plain(cfg.title(item)) || 'Untitled') + '</b>' +
        '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-move="' + kind + ':' + i + ':-1" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + ic('up') + '</button>' +
        '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-move="' + kind + ':' + i + ':1" aria-label="Move down"' + (i === arr.length - 1 ? ' disabled' : '') + '>' + ic('chev') + '</button>' +
        '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-remove="' + kind + ':' + i + '" aria-label="Remove">' + ic('trash') + '</button></div>' +
        fields(kind + '.' + i, cfg.f) + '</div>';
    }).join('') + '<button class="btn btn-secondary btn-sm" type="button" data-add="' + kind + '" style="align-self:flex-start">' + ic('plus') + esc(cfg.add) + '</button>';
  }
  function sectionToggle(id) { var i = draft.sections.map(function (s) { return s.id; }).indexOf(id); return i < 0 ? '' : field('sections.' + i + '.show', { l: 'Show this section', t: 'bool' }); }

  var TABS = [['profile', 'Profile'], ['layout', 'Sections'], ['appearance', 'Appearance'], ['about', 'About & skills'], ['projects', 'Projects'], ['experience', 'Experience'], ['testimonials', 'Testimonials'], ['achievements', 'Achievements'], ['certifications', 'Certifications'], ['socials', 'Socials'], ['contact', 'Contact'], ['messages', 'Messages'], ['json', 'JSON']];
  function adminTab() {
    var d = draft, h = '';
    switch (state.tab) {
      case 'profile':
        h += '<div class="ed-title">Identity</div>' + fields('profile', [{ k: 'avatar', l: 'Profile photo', t: 'upload' }, { k: 'name', l: 'Full name', half: 1 }, { k: 'initials', l: 'Initials', half: 1, hint: 'Shown when there is no photo' }, { k: 'role', l: 'Role', half: 1 }, { k: 'company', l: 'Company', half: 1 }]) +
          '<div class="ed-title">Hero</div>' + fields('profile', [{ k: 'headline', l: 'Headline', hint: 'Wrap words in *asterisks* to style them as the accent' }, { k: 'rotatePrefix', l: 'Rotating line, prefix', half: 1 }, { k: 'rotating', l: 'Rotating words', t: 'comma', half: 1, hint: 'Separate with commas' }, { k: 'bio', l: 'Short bio', t: 'area', rows: 3 },
            { k: 'available', l: 'Show availability badge', t: 'bool' }, { k: 'availabilityText', l: 'Availability text' }, { k: 'ctaPrimary', l: 'Primary button label', half: 1 }, { k: 'ctaSecondary', l: 'Secondary button label', half: 1 }, { k: 'resume', l: 'Resume link', ph: 'https://drive.google.com/…', hint: 'Adds a Resume button' }]) +
          '<div class="ed-title">Profile card</div>' + fields('profile', [{ k: 'location', l: 'Location', half: 1 }, { k: 'yearsLabel', l: 'Experience label', half: 1 }, { k: 'timezone', l: 'Time zone', half: 1, hint: 'e.g. Asia/Kolkata' }, { k: 'tzLabel', l: 'Time zone label', half: 1 }, { k: 'focus', l: 'Focus' }]) +
          '<div class="ed-title">Stats</div>' + listEditor('stats') +
          '<div class="ed-title">Footer</div>' + fields('profile', [{ k: 'footer', l: 'Footer line' }]);
        break;
      case 'layout':
        h += '<div class="note-box">Turn sections on or off, rename them, and change their order. Wrap words in *asterisks* in a title to style them as the accent.</div>' +
          d.sections.map(function (s, i) {
            return '<div class="ed-item' + (s.show === false ? ' off' : '') + '"><div class="ed-item-head"><b>' + esc(SECTION_NAMES[s.id]) + '</b>' +
              '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-move="sections:' + i + ':-1" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + ic('up') + '</button>' +
              '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-move="sections:' + i + ':1" aria-label="Move down"' + (i === d.sections.length - 1 ? ' disabled' : '') + '>' + ic('chev') + '</button></div>' +
              field('sections.' + i + '.show', { l: 'Show on page', t: 'bool' }) +
              (s.id === 'stack' ? '<span class="hint" style="font-size:.75rem;color:var(--text-3)">A scrolling strip of every skill and project technology, shown under the hero.</span>' :
                fields('sections.' + i, [{ k: 'nav', l: 'Menu label', half: 1, hint: 'Leave empty to hide from the menu' }, { k: 'eyebrow', l: 'Small label', half: 1 }, { k: 'title', l: 'Title' }, { k: 'subtitle', l: 'Subtitle', t: 'area', rows: 2 }])) + '</div>';
          }).join('');
        break;
      case 'appearance':
        var cur = (d.theme.accent || '').toLowerCase();
        h += '<div class="ed-title">Accent color</div><div class="swatches">' + ACCENTS.map(function (a) { return '<button class="swatch" type="button" style="--c:' + a[1] + '" data-set="theme.accent:' + a[1] + '" aria-pressed="' + (cur === a[1]) + '" aria-label="' + a[0] + '" data-tip="' + a[0] + '"></button>'; }).join('') +
          '<input type="color" class="color-in" id="ed-theme-accent" data-path="theme.accent" value="' + esc(/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#2b59e8') + '" aria-label="Custom color" title="Custom color"></div>' +
          '<div class="ed-title">Background</div><div class="seg wide" role="group" aria-label="Background style">' + [['aurora', 'Aurora'], ['mesh', 'Mesh'], ['minimal', 'Minimal']].map(function (o) { return '<button type="button" data-set="theme.background:' + o[0] + '" aria-pressed="' + (d.theme.background === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
          fields('theme', [{ k: 'animate', l: 'Animate the aurora', t: 'bool' }, { k: 'grain', l: 'Film grain texture', t: 'bool' }, { k: 'serifAccent', l: 'Italic serif accent on highlighted words', t: 'bool' }]) +
          '<div class="ed-title">Default theme for visitors</div><div class="seg wide" role="group" aria-label="Default theme">' + [['auto', 'Match their system'], ['light', 'Light'], ['dark', 'Dark']].map(function (o) { return '<button type="button" data-set="theme.defaultMode:' + o[0] + '" aria-pressed="' + (d.theme.defaultMode === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
          '<span class="hint" style="font-size:.75rem;color:var(--text-3)">Visitors can still switch themes from the top bar.</span>';
        break;
      case 'about':
        h += fields('', [{ k: 'about', l: 'About text', t: 'area', rows: 7, hint: 'Leave a blank line between paragraphs. The first paragraph is shown larger.' }]) +
          '<div class="ed-title">Skill groups</div>' + listEditor('skills') +
          fields('', [{ k: 'learning', l: 'Currently learning', t: 'icons' }, { k: 'interests', l: 'Interests outside coding', t: 'comma' }]) +
          '<div class="ed-title">Tech strip</div>' + sectionToggle('stack');
        break;
      case 'projects': case 'experience': case 'testimonials': case 'achievements': case 'certifications': case 'socials':
        var secId = state.tab === 'projects' ? 'work' : state.tab;
        h += sectionToggle(secId) + listEditor(state.tab);
        if (state.tab === 'socials') h += '<div class="note-box">Profiles without a link are hidden from visitors. Paste a full link, or just your username for LinkedIn, GitHub, Medium, X and most others.</div>';
        break;
      case 'contact':
        h += sectionToggle('contact') + fields('contact', [{ k: 'email', l: 'Email', half: 1 }, { k: 'phone', l: 'Phone', half: 1, ph: '+91 …' }, { k: 'discord', l: 'Discord username', half: 1 }, { k: 'address', l: 'Address', half: 1, hint: 'Opens in Google Maps' }, { k: 'note', l: 'Reply note' }, { k: 'form', l: 'Show the message form', t: 'bool' }]) +
          '<span class="hint" style="font-size:.75rem;color:var(--text-3)">Empty channels are hidden from visitors.</span>';
        break;
      case 'messages':
        if (!state.db) { h += '<div class="note-box">Messages are not available in this view.</div>'; break; }
        if (!state.messages.length) { h += '<div class="empty-state" style="padding:2rem">' + ic('inbox') + '<p>No messages yet. When someone uses the contact form, it shows up here.</p></div>'; break; }
        h += state.messages.map(function (m) {
          var items = (m.items || []).slice().reverse(), when = m.updatedAt ? new Date(m.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
          return '<div class="msg"><div class="msg-head"><b>' + esc(m.name || 'Someone') + '</b><span>' + esc(when) + '</span></div><span class="from">' + esc(m.email || '') + '</span>' +
            items.map(function (it) { return '<p><span style="color:var(--text-3);font-size:.75rem">' + esc(it.topic || '') + (it.at ? ' · ' + esc(new Date(it.at).toLocaleDateString()) : '') + '</span><br>' + esc(it.text) + '</p>'; }).join('') + '</div>';
        }).join('');
        break;
      case 'json':
        h += '<div class="note-box">Everything on the page comes from this JSON. Paste an edited version, choose Apply, then Publish.</div>' +
          '<div class="field"><label for="ed-json">Portfolio data</label><textarea class="textarea json-area" id="ed-json" spellcheck="false">' + esc(JSON.stringify(draft, null, 2)) + '</textarea><span class="hint" id="json-note"></span></div>' +
          '<div class="cta-row"><button class="btn btn-secondary btn-sm" type="button" data-act="json-apply">' + ic('check') + 'Apply JSON</button><button class="btn btn-ghost btn-sm" type="button" data-act="json-copy">' + ic('copy') + 'Copy JSON</button></div>';
        break;
    }
    return h;
  }
  function renderDrawer() {
    var dr = $('#drawer'), body = $('.dr-body', dr), bodyScroll = body ? body.scrollTop : 0;
    var tabsEl = $('.dr-tabs', dr), tabScroll = tabsEl ? tabsEl.scrollLeft : 0;
    dr.innerHTML = '<div class="dr-head"><span class="mark">' + ic('pencil') + '</span><div class="grow"><h2 id="dr-title">Edit portfolio</h2><p>Changes preview live behind this panel.</p></div><button class="btn btn-ghost btn-icon" type="button" data-act="close-drawer" aria-label="Close editor">' + ic('x') + '</button></div>' +
      '<div class="dr-tabs" role="tablist">' + TABS.map(function (t) { return '<button class="dr-tab" role="tab" type="button" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + t[1] + (t[0] === 'messages' && state.messages.length ? '<span class="n">' + state.messages.length + '</span>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="dr-body">' + adminTab() + '</div>' +
      '<div class="dr-foot"><span class="grow' + (state.dirty ? ' dirty' : '') + '" id="dr-status">' + (state.readOnly ? 'You can preview edits but not publish them.' : state.dirty ? 'Unpublished changes' : 'All changes published') + '</span>' +
      '<button class="btn btn-ghost btn-sm" type="button" data-act="discard"' + (state.dirty ? '' : ' disabled') + '>Discard</button>' +
      '<button class="btn btn-accent btn-sm" type="button" data-act="publish"' + (state.dirty && !state.readOnly ? '' : ' disabled') + '>Publish changes</button></div>';
    $('.dr-body', dr).scrollTop = bodyScroll; $('.dr-tabs', dr).scrollLeft = tabScroll;
    var sel = $('.dr-tab[aria-selected="true"]', dr); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function markDirty() {
    state.dirty = true;
    var s = $('#dr-status'); if (s) { s.textContent = state.readOnly ? 'You can preview edits but not publish them.' : 'Unpublished changes'; s.classList.add('dirty'); }
    var pb = $('[data-act="publish"]'); if (pb && !state.readOnly) pb.disabled = false;
    var db = $('[data-act="discard"]'); if (db) db.disabled = false;
  }
  var pv;
  function previewSoon(appearance) { clearTimeout(pv); pv = setTimeout(function () { view = draft; if (appearance) applyAppearance(); renderPage(); }, 160); }
  function openDrawer(tab) {
    if (!state.isEditor) return;
    if (tab) state.tab = tab;
    if (!draft) draft = clone(DATA);
    view = draft; lastFocus = document.activeElement; renderDrawer();
    var dr = $('#drawer'); dr.hidden = false; openOverlay();
    requestAnimationFrame(function () { dr.classList.add('open'); var f = $('.dr-tab[aria-selected="true"]', dr); if (f) f.focus({ preventScroll: true }); });
  }
  function closeDrawer() { var dr = $('#drawer'); if (!dr.classList.contains('open')) return; dr.classList.remove('open'); setTimeout(function () { dr.hidden = true; }, 450); closeOverlay(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }

  function buildDoc(d) {
    var json = JSON.stringify(d, null, 2).replace(/</g, '\\u003c'), S = 'script';
    return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + RESET + '</style></head><body>' +
      '<title>' + esc(d.profile.name || 'Portfolio') + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="' + FONT + '">\n' +
      '<style id="pf-style">' + STYLE_SRC + '</style>\n\n<div class="bg" aria-hidden="true"><canvas id="bg-canvas"></canvas><div class="bg-grid"></div><div class="bg-grain"></div></div>\n<div id="app"></div>\n\n' +
      '<' + S + ' type="application/json" id="pf-data">\n' + json + '\n</' + S + '>\n' +
      '<' + S + ' type="application/json" id="pf-icons">' + ICONS_SRC + '</' + S + '>\n' +
      '<' + S + ' id="pf-app">' + APP_SRC + '</' + S + '>\n</body></html>';
  }
  function publish() {
    if (!state.artifact || !draft) return;
    var btn = $('[data-act="publish"]'); if (btn) { btn.disabled = true; btn.textContent = 'Publishing…'; }
    var d = clone(draft); delete d.sample;
    state.artifact.publish(buildDoc(d)).then(function () { toast('Published. Reloading…'); }, function (e) {
      var code = e && e.code, s = $('#dr-status');
      if (code === 'conflict') { if (s) s.textContent = 'A newer version was published. Reloading to it…'; return; }
      if (['not_writer', 'not_granted', 'consent_required', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(code) > -1) { state.readOnly = true; renderDrawer(); return; }
      if (s) { s.textContent = code === 'too_large' ? 'The page is too large to save. Try smaller images.' : code === 'rate_limited' ? 'Saving too often. Wait a minute and try again.' : 'Could not publish. Try again in a moment.'; s.classList.add('dirty'); }
      if (btn) { btn.disabled = false; btn.textContent = 'Publish changes'; }
    });
  }
  function upload(path, file) {
    if (!state.assets || !file) return;
    var s = $('#dr-status'); if (s) s.textContent = 'Uploading image…';
    state.assets.upload(file).then(function (r) { set(path, r.url); markDirty(); renderDrawer(); previewSoon(); toast('Image uploaded'); },
      function (e) { if (s) s.textContent = 'Upload failed' + (e && e.code === 'too_large' ? ': the image is over 20 MB.' : '. Try a different image.'); });
  }

  // ---------- contact form ----------
  function submitForm(form) {
    var name = form.name.value.trim(), email = form.email.value.trim(), msg = form.message.value.trim(), topic = form.topic.value, note = $('#cf-note');
    if (!name || !email || !msg) { note.textContent = 'Please fill in your name, how to reply, and a message.'; note.className = 'form-note err'; return; }
    if (!state.db || !state.user) return;
    state.sending = true; var b = $('button[type="submit"]', form), lbl = $('span', b); b.disabled = true; lbl.textContent = 'Sending…';
    state.user.id().then(function (uid) {
      if (!uid) throw { code: 'no_id' };
      var ref = state.db.doc('messages/' + uid);
      return ref.get().then(function (snap) {
        var prev = (snap.exists && snap.data().items) || [];
        var items = prev.concat([{ text: msg.slice(0, 4000), topic: topic, at: Date.now() }]).slice(-20);
        return ref.set({ name: name.slice(0, 120), email: email.slice(0, 200), items: items, updatedAt: Date.now() });
      });
    }).then(function () { state.sending = false; state.sent = true; rerenderSection('contact'); }, function () {
      state.sending = false; b.disabled = false; lbl.textContent = 'Send message';
      note.textContent = 'Your message could not be sent from this view. Use one of the channels on the left instead.'; note.className = 'form-note err';
    });
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a, [data-pal]');
    if (!t) { if (e.target.id === 'overlay') { closeModal(); closePalette(); closeDrawer(); } return; }
    if (t.dataset.themeSet) { applyTheme(t.dataset.themeSet, true); return; }
    if (t.dataset.copy) { copyText(t.dataset.copy, t.dataset.copyLabel); return; }
    if (t.dataset.editTab) { openDrawer(t.dataset.editTab); return; }
    if (t.dataset.openProject != null) { openProject(+t.dataset.openProject); return; }
    if (t.dataset.qopen != null) { var qi = +t.dataset.qopen; state.qopen[qi] = !state.qopen[qi]; rerenderSection('testimonials'); var qb = $('[data-qopen="' + qi + '"]'); if (qb) qb.focus({ preventScroll: true }); return; }
    if (t.dataset.expand != null) { var i = +t.dataset.expand, cur = state.expanded[i] != null ? state.expanded[i] : i === 0; state.expanded[i] = !cur; rerenderSection('experience'); var tb = $('[data-expand="' + i + '"]'); if (tb) tb.focus({ preventScroll: true }); return; }
    if (t.dataset.pal != null) { if (!t.href) e.preventDefault(); runPal(+t.dataset.pal); return; }
    if (t.dataset.tab) { state.tab = t.dataset.tab; renderDrawer(); var tt2 = $('.dr-tab[data-tab="' + state.tab + '"]'); if (tt2) tt2.focus({ preventScroll: true }); $('.dr-body').scrollTop = 0; return; }
    if (t.dataset.add) { var k = t.dataset.add; draft[k] = draft[k] || []; draft[k].push(LISTS[k].tpl()); markDirty(); renderDrawer(); previewSoon(); var body = $('.dr-body'); if (body) body.scrollTop = body.scrollHeight; return; }
    if (t.dataset.remove) { var r = t.dataset.remove.split(':'); draft[r[0]].splice(+r[1], 1); markDirty(); renderDrawer(); previewSoon(); return; }
    if (t.dataset.move) { var m = t.dataset.move.split(':'), arr = draft[m[0]], a = +m[1], b2 = a + (+m[2]); if (b2 < 0 || b2 >= arr.length) return; var tmp = arr[a]; arr[a] = arr[b2]; arr[b2] = tmp; markDirty(); renderDrawer(); previewSoon(); return; }
    if (t.dataset.clear) { set(t.dataset.clear, ''); markDirty(); renderDrawer(); previewSoon(); return; }
    if (t.dataset.set) { var sp = t.dataset.set.split(':'); set(sp[0], sp.slice(1).join(':')); markDirty(); renderDrawer(); previewSoon(true); if (sp[0] === 'theme.defaultMode' && !store('pf-theme')) applyTheme(sp[1]); return; }
    switch (t.dataset.act) {
      case 'palette': openPalette(); break;
      case 'edit': openDrawer(); break;
      case 'close': closeModal(); break;
      case 'close-drawer': closeDrawer(); break;
      case 'another': state.sent = false; rerenderSection('contact'); break;
      case 'discard': draft = clone(DATA); state.dirty = false; view = draft; applyAppearance(); renderDrawer(); renderPage(); toast('Changes discarded'); break;
      case 'publish': publish(); break;
      case 'json-copy': copyText(JSON.stringify(draft, null, 2), 'JSON'); break;
      case 'json-apply':
        try {
          var parsed = JSON.parse($('#ed-json').value);
          if (!parsed || typeof parsed !== 'object' || !parsed.profile) throw new Error('The JSON needs at least a "profile" section.');
          draft = normalize(parsed); markDirty(); renderDrawer(); previewSoon(true); toast('JSON applied. Review, then publish.');
        } catch (err) { var jn = $('#json-note'); jn.textContent = 'Could not apply: ' + err.message; jn.style.color = 'var(--danger)'; }
        break;
    }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'pal-q') { palSel = 0; renderPal(); return; }
    if (!el.dataset || !el.dataset.path || !draft) return;
    var v = el.dataset.bool ? el.checked : el.value;
    if (el.dataset.list === 'comma') v = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (el.dataset.list === 'lines') v = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (el.dataset.num) { v = Math.max(0, Math.min(360, +el.value || 0)); var dot = document.getElementById('dot-' + el.id); if (dot) dot.style.setProperty('--h', v); }
    set(el.dataset.path, v); markDirty();
    if (el.dataset.icons) { var pr = document.getElementById('prev-' + el.id); if (pr) pr.innerHTML = iconPreview(v); }
    previewSoon(el.dataset.path.indexOf('theme.') === 0);
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.bool && draft) { set(el.dataset.path, el.checked); markDirty(); var item = el.closest('.ed-item'); if (item && /sections\.\d+\.show/.test(el.dataset.path)) item.classList.toggle('off', !el.checked); previewSoon(el.dataset.path.indexOf('theme.') === 0); }
    if (el.dataset && el.dataset.upload) upload(el.dataset.upload, el.files && el.files[0]);
  });
  document.addEventListener('submit', function (e) { if (e.target.id === 'contact-form') { e.preventDefault(); submitForm(e.target); } });
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'k') { e.preventDefault(); if ($('#palette').classList.contains('open')) closePalette(); else openPalette(); return; }
    if (k === 'Escape') { if ($('#palette').classList.contains('open')) closePalette(); else if ($('#modal').classList.contains('open')) closeModal(); else if ($('#drawer').classList.contains('open')) closeDrawer(); return; }
    if ($('#palette').classList.contains('open')) {
      if (k === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); renderPal(); }
      if (k === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); renderPal(); }
      if (k === 'Enter') { e.preventDefault(); var a = palItems[palSel]; if (a && a.href) { var link = $('.pal-item.sel'); if (link) link.click(); } else runPal(palSel); }
      return;
    }
    if (k === '/' && !anyOpen() && !/input|textarea|select/i.test(e.target.tagName || '')) { e.preventDefault(); openPalette(); }
  });

  // ---------- boot ----------
  document.getElementById('app').innerHTML = '<div id="page"></div>' +
    '<div class="overlay" id="overlay" hidden></div>' +
    '<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden></div>' +
    '<div class="palette" id="palette" role="dialog" aria-modal="true" aria-label="Quick actions" hidden><div class="pal-input">' + ic('search') + '<input id="pal-q" placeholder="Search sections, projects, links…" autocomplete="off" aria-label="Search actions"><kbd>esc</kbd></div><div class="pal-list" id="pal-list" role="listbox"></div></div>' +
    '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" hidden></aside>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  applyAppearance();
  renderPage();

  if (window.claude && window.claude.use) {
    Promise.all([window.claude.use('user'), window.claude.use('artifact'), window.claude.use('db'), window.claude.use('assets')]).then(function (r) {
      state.user = r[0]; state.artifact = r[1]; state.db = r[2]; state.assets = r[3];
      return (state.user ? state.user.canEdit() : Promise.resolve(false)).then(function (canEdit) {
        state.isEditor = !!(canEdit && state.artifact);
        if (state.isEditor && state.db) {
          state.db.collection('messages').onSnapshot(function (snap) {
            state.messages = snap.docs.map(function (d) { return d.data() || {}; }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
            if ($('#drawer').classList.contains('open') && state.tab === 'messages') renderDrawer();
            var eb = $('.edit-btn'); if (eb) { var bd = $('.badge-dot', eb); if (state.messages.length) { if (!bd) { bd = document.createElement('span'); bd.className = 'badge-dot'; eb.appendChild(bd); } bd.textContent = state.messages.length; } else if (bd) bd.remove(); }
          }, function () {});
        }
        if (!$('#drawer').classList.contains('open')) renderPage();
      });
    }).catch(function () {});
  }
})();
