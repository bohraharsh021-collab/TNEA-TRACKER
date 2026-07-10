// TNEA Tracker - Overhauled Analytics Dashboard Client (Chart.js)

(function () {
  'use strict';

  const API_BASE = '/api';

  // Chart instances
  let trendChartInstance = null;
  let analyticsChartInstance = null;

  // 100 Analytics Inventory Mapping
  const ANALYTICS_MAP = {
    "col_comp": [
      { id: "col_comp_1", name: "Top CSE Colleges (2025)" },
      { id: "col_comp_2", name: "Top ECE Colleges (2025)" },
      { id: "col_comp_3", name: "Top IT Colleges (2025)" },
      { id: "col_comp_4", name: "Top AI & Data Science Colleges" },
      { id: "col_comp_5", name: "Chennai vs Coimbatore Top Colleges" },
      { id: "col_comp_6", name: "Top Mechanical Engineering Colleges (2025)" },
      { id: "col_comp_7", name: "Top Civil Engineering Colleges (2025)" },
      { id: "col_comp_8", name: "Top Government Aided Private Colleges" },
      { id: "col_comp_9", name: "Top University Departments (Anna University)" },
      { id: "col_comp_10", name: "Top Self-Financing Colleges (2025)" }
    ],
    "br_pop": [
      { id: "br_pop_1", name: "Top 10 Branches by College Count" },
      { id: "br_pop_2", name: "CSE & Allied Branches Density" },
      { id: "br_pop_3", name: "ECE and EEE Coverage" },
      { id: "br_pop_4", name: "Core Engineering Branches College Count" },
      { id: "br_pop_5", name: "Emerging Technologies College Counts" },
      { id: "br_pop_6", name: "Tamil Medium Branches Offering" },
      { id: "br_pop_7", name: "Branch Popularity in Government Colleges" },
      { id: "br_pop_8", name: "Branch Popularity in Autonomous Colleges" },
      { id: "br_pop_9", name: "Branch Popularity in Non-Autonomous Colleges" },
      { id: "br_pop_10", name: "AI & Data Science College Growth (2022-2025)" }
    ],
    "seat_dist": [
      { id: "seat_dist_1", name: "Colleges Offering 5+ Branches" },
      { id: "seat_dist_2", name: "Colleges Offering 10+ Branches" },
      { id: "seat_dist_3", name: "Branch Variety Count by District" },
      { id: "seat_dist_4", name: "Top 10 Colleges with Maximum Branch Variety" },
      { id: "seat_dist_5", name: "Branch Density in Government vs Autonomous" },
      { id: "seat_dist_6", name: "Colleges Offering CSE (CS)" },
      { id: "seat_dist_7", name: "Colleges Offering ECE (EC)" },
      { id: "seat_dist_8", name: "Colleges Offering MECH (ME)" },
      { id: "seat_dist_9", name: "Colleges Offering CIVIL (CE)" },
      { id: "seat_dist_10", name: "Colleges Offering AI & DS (AD)" }
    ],
    "rank_ana": [
      { id: "rank_ana_1", name: "Courses Closing Under Rank 10,000" },
      { id: "rank_ana_2", name: "Courses Closing Between Ranks 10,000 & 50,000" },
      { id: "rank_ana_3", name: "Courses Closing Between Ranks 50,000 & 100,000" },
      { id: "rank_ana_4", name: "Courses Closing Above Rank 100,000" },
      { id: "rank_ana_5", name: "Average Closing Rank by District" },
      { id: "rank_ana_6", name: "Average Closing Rank by Institution Type" },
      { id: "rank_ana_7", name: "Rank Spread (Min/Max) for CSE (2025)" },
      { id: "rank_ana_8", name: "Rank Spread (Min/Max) for ECE (2025)" },
      { id: "rank_ana_9", name: "Rank Spread (Min/Max) for MECH (2025)" },
      { id: "rank_ana_10", name: "Rank Spread (Min/Max) for CIVIL (2025)" }
    ],
    "hist_tr": [
      { id: "hist_tr_1", name: "CEG Campus CSE YoY Rank Shift" },
      { id: "hist_tr_2", name: "MIT Campus ECE YoY Rank Shift" },
      { id: "hist_tr_3", name: "PSG Tech CSE YoY Rank Shift" },
      { id: "hist_tr_4", name: "SSN CSE YoY Rank Shift" },
      { id: "hist_tr_5", name: "CIT Chennai CSE YoY Rank Shift" },
      { id: "hist_tr_6", name: "Kumaraguru CSE YoY Rank Shift" },
      { id: "hist_tr_7", name: "GCT Coimbatore CSE YoY Rank Shift" },
      { id: "hist_tr_8", name: "Thiagarajar EEE YoY Rank Shift" },
      { id: "hist_tr_9", name: "Coimbatore Inst of Tech CSE YoY Rank Shift" },
      { id: "hist_tr_10", name: "Sri Venkateswara CSE YoY Rank Shift" }
    ],
    "reg_ana": [
      { id: "reg_ana_1", name: "Top 10 Colleges in Chennai District" },
      { id: "reg_ana_2", name: "Top 10 Colleges in Coimbatore District" },
      { id: "reg_ana_3", name: "Top 10 Colleges in Madurai District" },
      { id: "reg_ana_4", name: "Top 10 Colleges in Trichy District" },
      { id: "reg_ana_5", name: "Top 10 Colleges in Salem District" },
      { id: "reg_ana_6", name: "Region-wise Average Closing Rank Comparison" },
      { id: "reg_ana_7", name: "Colleges Count: Chennai vs Coimbatore" },
      { id: "reg_ana_8", name: "Colleges Count in Southern Districts" },
      { id: "reg_ana_9", name: "Colleges Count in Western Districts" },
      { id: "reg_ana_10", name: "Colleges Count in Northern Districts" }
    ],
    "inst_ana": [
      { id: "inst_ana_1", name: "Government Colleges Minimum Closing Rank" },
      { id: "inst_ana_2", name: "Autonomous Colleges Minimum Closing Rank" },
      { id: "inst_ana_3", name: "Non-Autonomous Colleges Minimum Closing Rank" },
      { id: "inst_ana_4", name: "Government vs Autonomous Rank Range" },
      { id: "inst_ana_5", name: "Unique Branches Offered by Government Colleges" },
      { id: "inst_ana_6", name: "Unique Branches Offered by Autonomous Colleges" },
      { id: "inst_ana_7", name: "Unique Branches Offered by Non-Autonomous Colleges" },
      { id: "inst_ana_8", name: "Total Colleges Distribution by Type" },
      { id: "inst_ana_9", name: "Top 10 Government College Ranks" },
      { id: "inst_ana_10", name: "Top 10 Autonomous Private Ranks" }
    ],
    "br_dem": [
      { id: "br_dem_1", name: "Top 10 Branches by Average Closing Rank (Demand)" },
      { id: "br_dem_2", name: "Average Closing Ranks for Computer Science Branches" },
      { id: "br_dem_3", name: "Average Closing Ranks for Information Technology (IT)" },
      { id: "br_dem_4", name: "Average Closing Ranks for ECE Branches" },
      { id: "br_dem_5", name: "Average Closing Ranks for Electrical (EEE) Branches" },
      { id: "br_dem_6", name: "Average Closing Ranks for Biotechnology Branches" },
      { id: "br_dem_7", name: "Average Closing Ranks for AI & ML Branches" },
      { id: "br_dem_8", name: "Average Closing Ranks for Mech & Civil core Branches" },
      { id: "br_dem_9", name: "Branches with Biggest General Rank jumps YoY" },
      { id: "br_dem_10", name: "Branches with Highest Variance in Closing Rank" }
    ],
    "adm_stat": [
      { id: "adm_stat_1", name: "Participating Colleges count by Year" },
      { id: "adm_stat_2", name: "Unique Branch Codes Count by Year" },
      { id: "adm_stat_3", name: "Ranks Count by Community (OC Academic)" },
      { id: "adm_stat_4", name: "Closing Rank 1 to 5,000 College Choices" },
      { id: "adm_stat_5", name: "Closing Rank 5,000 to 20,000 College Choices" },
      { id: "adm_stat_6", name: "Closing Rank 20,000 to 50,000 College Choices" },
      { id: "adm_stat_7", name: "Average District College Density (2025)" },
      { id: "adm_stat_8", name: "Number of Self-Financing Private Colleges by District" },
      { id: "adm_stat_9", name: "Number of Government engineering Colleges by District" },
      { id: "adm_stat_10", name: "Total Database Admission Rows by Year" }
    ],
    "stu_ins": [
      { id: "stu_ins_1", name: "Top 10 Colleges with Biggest General Rank Rise (Boom)" },
      { id: "stu_ins_2", name: "High-Demand Niche Courses (Ranks under 20k)" },
      { id: "stu_ins_3", name: "Ranks Comparison for Food Technology Branches" },
      { id: "stu_ins_4", name: "Ranks Comparison for Biomedical Engineering" },
      { id: "stu_ins_5", name: "Ranks Comparison for Agricultural Engineering" },
      { id: "stu_ins_6", name: "Ranks Comparison for Textile Technology" },
      { id: "stu_ins_7", name: "Top Colleges for Sandwich Courses" },
      { id: "stu_ins_8", name: "Top Choices in Tier-2/Tier-3 Cities" },
      { id: "stu_ins_9", name: "Branch Count vs Average Closing Rank correlation" },
      { id: "stu_ins_10", name: "Ranks Spread inside Top 5 Colleges" }
    ]
  };

  // Colors
  const colorsList = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(99, 102, 241, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(124, 58, 237, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(251, 146, 60, 0.8)'
  ];

  // Configure Chart defaults
  function setChartDefaults() {
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.2)';
    Chart.defaults.font.family = "'Inter', sans-serif";
  }

  const darkTooltip = {
    backgroundColor: '#111827',
    titleColor: '#f9fafb',
    bodyColor: '#9ca3af',
    borderColor: 'rgba(75, 85, 99, 0.4)',
    borderWidth: 1,
    padding: 12,
    displayColors: false
  };

  // 1. Chart 1: Interactive Analytics Explorer
  async function initAnalyticsExplorer() {
    const categorySelect = document.getElementById('analytics-category-select');
    const moduleSelect = document.getElementById('analytics-module-select');
    const canvas = document.getElementById('analytics-explorer-chart');
    const moduleTitle = document.getElementById('analytics-module-title');
    const moduleDesc = document.getElementById('analytics-module-description');

    if (!categorySelect || !moduleSelect || !canvas) return;

    // Populate modules based on category selection
    function populateModules(categoryKey) {
      moduleSelect.innerHTML = '';
      const list = ANALYTICS_MAP[categoryKey] || [];
      list.forEach((m, idx) => {
        moduleSelect.appendChild(new Option(m.name, m.id));
        if (idx === 0) moduleSelect.value = m.id;
      });
      loadModuleChart(moduleSelect.value);
    }

    async function loadModuleChart(moduleId) {
      if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
        analyticsChartInstance = null;
      }

      try {
        const res = await fetch(`${API_BASE}/analytics?module=${moduleId}`);
        if (!res.ok) throw new Error();
        const resData = await res.json();

        // Update titles
        moduleTitle.innerText = resData.name;
        moduleDesc.innerText = resData.description;

        const labels = resData.data.map(d => shortenLabel(d.label));
        const values = resData.data.map(d => d.value);

        const ctx = canvas.getContext('2d');
        const isLine = resData.chartType === 'line';
        
        // Reverse scale checks: rank displays are better when smaller values are at the top
        const isRankValue = moduleId.includes('comp') || moduleId.includes('reg') || moduleId.includes('inst') || moduleId.includes('dem') || moduleId.includes('stu');

        let backgroundColors = colorsList.slice(0, resData.data.length);
        while (backgroundColors.length < resData.data.length) {
          backgroundColors = backgroundColors.concat(colorsList);
        }

        const chartConfig = {
          type: isLine ? 'line' : 'bar',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: isLine ? 'rgba(99, 102, 241, 0.2)' : backgroundColors,
              borderColor: '#6366f1',
              borderWidth: isLine ? 3 : 0,
              borderRadius: isLine ? 0 : 4,
              fill: isLine,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...darkTooltip,
                callbacks: {
                  label: function (context) {
                    const label = isRankValue ? 'Closing Rank' : 'Value';
                    return `${label}: ${context.parsed.y.toLocaleString('en-IN')}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 30 }
              },
              y: {
                reverse: isRankValue, // Top general ranks at the top
                grid: { color: 'rgba(75, 85, 99, 0.1)' },
                ticks: {
                  callback: function(val) {
                    return val.toLocaleString('en-IN');
                  }
                }
              }
            }
          }
        };

        analyticsChartInstance = new Chart(ctx, chartConfig);
      } catch(err) {
        console.error(err);
      }
    }

    categorySelect.addEventListener('change', () => populateModules(categorySelect.value));
    moduleSelect.addEventListener('change', () => loadModuleChart(moduleSelect.value));

    // Initialize first
    populateModules(categorySelect.value);
  }

  // 2. Chart 2: Individual YoY Ranks Trend
  async function initTrendChart() {
    const canvas = document.getElementById('trend-chart');
    const collegeSelect = document.getElementById('trend-college-select');
    const branchSelect = document.getElementById('trend-branch-select');
    if (!canvas || !collegeSelect || !branchSelect) return;

    try {
      const resCol = await fetch(`${API_BASE}/trend-colleges`);
      if (!resCol.ok) throw new Error();
      const colleges = await resCol.json();

      collegeSelect.innerHTML = '';
      colleges.forEach((c, idx) => {
        collegeSelect.appendChild(new Option(`${c.code} - ${shortenLabel(c.name)}`, c.code));
      });

      async function populateBranches(collegeCode) {
        const resBr = await fetch(`${API_BASE}/colleges?year=2025&limit=100&search=${collegeCode}`);
        if (!resBr.ok) return;
        const result = await resBr.json();

        const branches = new Set();
        result.data.forEach(r => {
          if (r['College Code'] == collegeCode) {
            branches.add(r['Branch Name']);
          }
        });

        branchSelect.innerHTML = '';
        Array.from(branches).sort().forEach(br => {
          branchSelect.appendChild(new Option(titleCase(br), br));
        });

        updateTrendChart();
      }

      async function updateTrendChart() {
        if (trendChartInstance) {
          trendChartInstance.destroy();
          trendChartInstance = null;
        }

        const collegeCode = collegeSelect.value;
        const branchName = branchSelect.value;
        if (!collegeCode || !branchName) return;

        const resTr = await fetch(`${API_BASE}/trends?college=${collegeCode}&branch=${encodeURIComponent(branchName)}`);
        if (!resTr.ok) return;
        const trendData = await resTr.json();

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 350);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        trendChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: trendData.years.map(String),
            datasets: [{
              data: trendData.ranks,
              borderColor: '#3b82f6',
              backgroundColor: gradient,
              fill: true,
              borderWidth: 3,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverRadius: 7,
              pointRadius: 5,
              tension: 0.3,
              spanGaps: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...darkTooltip,
                callbacks: {
                  label: function(context) {
                    return `Closing Rank: ${context.parsed.y.toLocaleString('en-IN')}`;
                  }
                }
              }
            },
            scales: {
              y: {
                reverse: true, // Rank 1 is top
                grid: { color: 'rgba(75, 85, 99, 0.1)' },
                title: { display: true, text: 'Closing Rank (Top to Bottom)', color: '#9ca3af' }
              },
              x: {
                grid: { display: false },
                title: { display: true, text: 'Counselling Year', color: '#9ca3af' }
              }
            }
          }
        });
      }

      collegeSelect.addEventListener('change', () => populateBranches(collegeSelect.value));
      branchSelect.addEventListener('change', updateTrendChart);

      if (collegeSelect.value) {
        populateBranches(collegeSelect.value);
      }
    } catch(err) {
      console.error(err);
    }
  }

  // Helper Utilities
  function shortenLabel(name) {
    if (!name) return '';
    
    // Smart abbreviations for top/common institutions to keep them highly readable
    let cleanName = name
      .replace(/UNIVERSITY DEPARTMENTS OF ANNA UNIVERSITY,?\s*CHENNAI\s*-\s*CEG CAMPUS/gi, 'Anna Univ, Chennai – CEG Campus')
      .replace(/UNIVERSITY DEPARTMENTS OF ANNA UNIVERSITY,?\s*CHENNAI\s*-\s*MIT CAMPUS/gi, 'Anna Univ, Chennai – MIT Campus')
      .replace(/UNIVERSITY DEPARTMENTS OF ANNA UNIVERSITY,?\s*CHENNAI\s*-\s*ACT CAMPUS/gi, 'Anna Univ, Chennai – ACT Campus')
      .replace(/GOVERNMENT COLLEGE OF ENGINEERING/gi, 'Govt Coll of Engg')
      .replace(/COIMBATORE INSTITUTE OF TECHNOLOGY/gi, 'CIT Coimbatore')
      .replace(/PSG COLLEGE OF TECHNOLOGY/gi, 'PSG Tech')
      .replace(/THIAGARAJAR COLLEGE OF ENGINEERING/gi, 'TCE Madurai')
      .replace(/SRI SIVASUBRAMANIYA NADAR COLLEGE OF ENGINEERING/gi, 'SSN Kalavakkam')
      .replace(/KONGU ENGINEERING COLLEGE/gi, 'Kongu Engg Coll')
      .replace(/KUMARAGURU COLLEGE OF TECHNOLOGY/gi, 'KCT Coimbatore');
      
    // Apply generic abbreviation replacements if no exact match occurred
    if (cleanName === name) {
      cleanName = cleanName
        .replace(/GOVERNMENT/gi, 'Govt')
        .replace(/CONSTITUENT/gi, 'Const')
        .replace(/COLLEGE OF ENGINEERING/gi, 'Coll of Engg')
        .replace(/COLLEGE OF TECHNOLOGY/gi, 'Coll of Tech')
        .replace(/INSTITUTE OF TECHNOLOGY/gi, 'Inst of Tech')
        .replace(/AND TECHNOLOGY/gi, '& Tech')
        .replace(/AND SCIENCE/gi, '& Sci')
        .replace(/ENGINEERING COLLEGE/gi, 'Engg Coll')
        .replace(/AUTOMATION/gi, 'Auto')
        .replace(/INFORMATION/gi, 'Info')
        .replace(/TECHNOLOGY/gi, 'Tech')
        .replace(/ENGINEERING/gi, 'Engg')
        .replace(/AUTONOMOUS/gi, 'Auton');
    }
    
    // Remove bracketed elements like (AUTONOMOUS) or (TAMIL MEDIUM)
    cleanName = cleanName.replace(/\(.*?\)/g, '').trim();
    
    // Remove trailing commas/spaces
    cleanName = cleanName.replace(/,\s*$/, '').trim();

    if (cleanName.length > 55) {
      return cleanName.substring(0, 52) + '...';
    }
    return cleanName;
  }

  function titleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  async function initDashboardCharts() {
    try {
      const res = await fetch(`${API_BASE}/dash-summary`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // Populate Overview stats cards
      const colEl = document.getElementById('stat-dash-colleges');
      const brEl = document.getElementById('stat-dash-branches');
      const yrEl = document.getElementById('stat-dash-years');
      const recEl = document.getElementById('stat-dash-records');
      
      if (colEl) colEl.innerText = data.metrics.colleges.toLocaleString();
      if (brEl) brEl.innerText = data.metrics.branches.toLocaleString();
      if (yrEl) yrEl.innerText = data.metrics.years.toLocaleString();
      if (recEl) recEl.innerText = data.metrics.admissions.toLocaleString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "+";
      
      // Chart A: Seat Distribution by Institution Type (Doughnut)
      const instCtx = document.getElementById('dash-chart-inst-type').getContext('2d');
      new Chart(instCtx, {
        type: 'doughnut',
        data: {
          labels: data.instType.map(d => d.label),
          datasets: [{
            data: data.instType.map(d => d.value),
            backgroundColor: [
              'rgba(99, 102, 241, 0.85)',
              'rgba(139, 92, 246, 0.85)',
              'rgba(16, 185, 129, 0.85)'
            ],
            borderColor: 'rgba(15, 23, 42, 0.8)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 9.5 } }
            },
            tooltip: darkTooltip
          },
          cutout: '65%'
        }
      });

      // Chart B: Top 10 Districts by College Count (Bar)
      const distCtx = document.getElementById('dash-chart-districts').getContext('2d');
      new Chart(distCtx, {
        type: 'bar',
        data: {
          labels: data.districts.map(d => titleCase(d.label)),
          datasets: [{
            data: data.districts.map(d => d.value),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: darkTooltip
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 8 }, maxRotation: 45, minRotation: 30 }
            },
            y: {
              grid: { color: 'rgba(75, 85, 99, 0.1)' }
            }
          }
        }
      });

      // Chart C: Top 10 Branches by College Count (Horizontal Bar)
      const branchCtx = document.getElementById('dash-chart-branches').getContext('2d');
      new Chart(branchCtx, {
        type: 'bar',
        data: {
          labels: data.branches.map(d => d.label),
          datasets: [{
            data: data.branches.map(d => d.value),
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: darkTooltip
          },
          scales: {
            x: {
              grid: { color: 'rgba(75, 85, 99, 0.1)' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 8.5 } }
            }
          }
        }
      });

      // Chart D: Average Closing Rank of Top Districts (Horizontal Bar)
      const rankCtx = document.getElementById('dash-chart-ranks').getContext('2d');
      new Chart(rankCtx, {
        type: 'bar',
        data: {
          labels: data.ranks.map(d => titleCase(d.label)),
          datasets: [{
            data: data.ranks.map(d => d.value),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...darkTooltip,
              callbacks: {
                label: function(context) {
                  return `Avg Rank: ${context.parsed.x.toLocaleString('en-IN')}`;
                }
              }
            }
          },
          scales: {
            x: {
              reverse: true,
              grid: { color: 'rgba(75, 85, 99, 0.1)' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 8.5 } }
            }
          }
        }
      });
      
    } catch (err) {
      console.error('Error loading dash summary:', err);
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') return;
    setChartDefaults();
    initDashboardCharts();
    initAnalyticsExplorer();
    initTrendChart();
  });

})();
