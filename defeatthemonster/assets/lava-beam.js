/* Lava eye lasers (styles in assets/lava-beam.css): an SVG filter that makes the beam lines bubble and
   flow like molten lava, and a few drips that fall off every new beam. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function defs() {
    if (document.getElementById('lava-flow')) return;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    // lava-flow: darker blotches (cooling crust) over the stream + wobbly, boiling edges
    // lava-core: the hot centre ripples a little
    svg.innerHTML =
      '<defs>' +
      '<filter id="lava-flow" filterUnits="userSpaceOnUse" x="-4000" y="-4000" width="8000" height="8000" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.045 0.11" numOctaves="2" seed="3" result="n">' +
          '<animate attributeName="baseFrequency" dur="0.9s" repeatCount="indefinite" values="0.045 0.11;0.05 0.09;0.045 0.11"/></feTurbulence>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 .9 .35  0 0 0 .9 .35  0 0 0 .9 .35  0 0 0 0 1" result="shade"/>' +
        '<feComposite in="SourceGraphic" in2="shade" operator="arithmetic" k1="1" result="tex"/>' +
        '<feDisplacementMap in="tex" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>' +
      '<filter id="lava-core" filterUnits="userSpaceOnUse" x="-4000" y="-4000" width="8000" height="8000">' +
        '<feTurbulence type="turbulence" baseFrequency="0.08 0.2" numOctaves="1" seed="7" result="n">' +
          '<animate attributeName="baseFrequency" dur="0.6s" repeatCount="indefinite" values="0.08 0.2;0.1 0.16;0.08 0.2"/></feTurbulence>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>' +
      '</defs>';
    document.body.appendChild(svg);
  }
  // drips: along each eye's beam, falling a little after the stream reaches out
  function drip(g) {
    if (g.dataset.lava) return; g.dataset.lava = '1';
    Array.prototype.forEach.call(g.querySelectorAll('line.beam-core'), function (l) {
      var x1 = +l.getAttribute('x1'), y1 = +l.getAttribute('y1'), x2 = +l.getAttribute('x2'), y2 = +l.getAttribute('y2');
      for (var i = 0; i < 4; i++) {
        var t = .2 + Math.random() * .7, c = document.createElementNS(NS, 'circle');
        c.setAttribute('class', 'lava-drip');
        c.setAttribute('cx', x1 + (x2 - x1) * t); c.setAttribute('cy', y1 + (y2 - y1) * t + 4);
        c.setAttribute('r', 2.5 + Math.random() * 3);
        c.style.animationDelay = (.12 + t * .18 + Math.random() * .08) + 's';
        g.appendChild(c);
      }
    });
  }
  function scan() { document.querySelectorAll('.attack-layer .beam-attack[class*=lava-]').forEach(drip); }
  function start() { defs(); new MutationObserver(scan).observe(document.body, {childList: true, subtree: true}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
