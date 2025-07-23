// document.addEventListener("DOMContentLoaded", function () {
//   const ctx = document.getElementById('dailyProfitChart')?.getContext('2d');
//   if (!ctx || !window.profitDates || !window.profitValues) return;

//   new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels: window.profitDates,
//       datasets: [{
//         label: '📈 الربح اليومي (دينار)',
//         data: window.profitValues,
//         borderColor: '#4caf50',
//         backgroundColor: '#4caf5077',
//         fill: true,
//         tension: 0.3,
//         pointRadius: 4,
//         pointBackgroundColor: '#fff',
//         pointBorderColor: '#4caf50',
//       }]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       scales: {
//         y: {
//           beginAtZero: true,
//           ticks: { color: '#ccc' }
//         },
//         x: {
//           ticks: { color: '#ccc' }
//         }
//       },
//       plugins: {
//         legend: { labels: { color: '#eee' } }
//       }
//     }
//   });
// });

console.log(window.profitDates);
console.log(window.profitValues);
document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById('dailyProfitChart')?.getContext('2d');
  if (!ctx || !window.profitDates || !window.profitValues) {
    console.warn("😔 الرسم البياني ما قدر يلقى البيانات أو العنصر");
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: window.profitDates,
      datasets: [{
        label: '📈 الربح اليومي',
        data: window.profitValues,
        borderColor: '#4caf50',
        backgroundColor: '#4caf5077',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
});
