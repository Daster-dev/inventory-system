fetch('/stats-data')
  .then(r => r.json())
  .then(data => {
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{ label: 'عدد المبيعات', data: data.values, backgroundColor: '#36A2EB' }]
      }
    });
  });
