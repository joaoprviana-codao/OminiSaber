(() => {
  const routes = {
    dashboard: '../dashboard_principal/code.html',
    inicio: '../dashboard_principal/code.html',
    trilhas: '../modulo_de_trilhas/code.html',
    redacao: '../laboratorio_de_redacao/code.html',
    evolucao: '../minha_evolucao/code.html',
    biblioteca: '../biblioteca_digital/code.html'
  };

  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  document.querySelectorAll('a[href="#"]').forEach((link) => {
    const label = normalize(link.textContent);
    const routeKey = Object.keys(routes).find((key) => label.includes(key));

    if (routeKey) {
      link.href = routes[routeKey];
    }
  });
})();
