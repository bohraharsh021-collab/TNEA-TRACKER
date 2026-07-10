// TNEA Tracker - REST Client Application JavaScript

// Constants
const RESULTS_PER_PAGE = 25;
const API_BASE = '/api';

// State Variables
let currentPage = 1;
let choiceList = [];
let explorerTotal = 0;
let explorerColleges = []; // Holds current page colleges

// Course Explorer State
let allBranches = [];
let showAllCourses = false;

// DOM Elements
let navLinks, mobileMenuBtn, navbar;
let yearFilter, districtFilter, branchFilter, tierFilter;
let applyFiltersBtn, resetFiltersBtn;
let resultsCount, sortBy, resultsBody, pagination, sortControlsWrapper;
let courseSearch, courseGrid, courseYearFilter, showMoreCoursesBtn;
let studentRank, studentCutoff, predDistrict, predBranch, predTier, predictBtn, predictorResults;
let choiceCount, exportPdfBtn, exportCsvBtn, clearChoicesBtn, choiceListContainer;
let toast, toastMessage;
let modal, modalClose, modalTitle, modalSubtitle, modalBody;
let backToTopBtn;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeDOMReferences();
  loadChoiceList();
  setupEventListeners();
  
  // Wait for SQLite database to be ready, then fetch dynamic stats for hero and populate filters
  if (window.dbReadyPromise) {
    window.dbReadyPromise.then(async () => {
      await loadDynamicHeroStats();
      loadFiltersData();
      loadBranchExplorer();
    });
  } else {
    loadFiltersData();
    loadBranchExplorer();
    runHeroAnimations();
  }
  
  // Setup animations
  setupScrollEffects();
  
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Initialize DOM References
function initializeDOMReferences() {
  navbar = document.getElementById('navbar');
  navLinks = document.getElementById('nav-links');
  mobileMenuBtn = document.getElementById('mobile-menu-btn');
  
  yearFilter = document.getElementById('year-filter');
  districtFilter = document.getElementById('district-filter');
  branchFilter = document.getElementById('branch-filter');
  tierFilter = document.getElementById('tier-filter');
  
  applyFiltersBtn = document.getElementById('apply-filters-btn');
  resetFiltersBtn = document.getElementById('reset-filters-btn');
  
  resultsCount = document.getElementById('results-count');
  sortBy = document.getElementById('sort-by');
  resultsBody = document.getElementById('results-body');
  pagination = document.getElementById('pagination');
  sortControlsWrapper = document.getElementById('sort-controls-wrapper');
  
  courseSearch = document.getElementById('course-search');
  courseGrid = document.getElementById('course-grid');
  courseYearFilter = document.getElementById('course-year-filter');
  showMoreCoursesBtn = document.getElementById('show-more-courses-btn');
  
  studentRank = document.getElementById('student-rank');
  studentCutoff = document.getElementById('student-cutoff');
  predDistrict = document.getElementById('pred-district');
  predBranch = document.getElementById('pred-branch');
  predTier = document.getElementById('pred-tier');
  predictBtn = document.getElementById('predict-btn');
  predictorResults = document.getElementById('predictor-results');
  
  choiceCount = document.getElementById('choice-count');
  exportPdfBtn = document.getElementById('export-pdf-btn');
  exportCsvBtn = document.getElementById('export-csv-btn');
  clearChoicesBtn = document.getElementById('clear-choices-btn');
  choiceListContainer = document.getElementById('choice-list-container');
  
  toast = document.getElementById('toast');
  toastMessage = document.getElementById('toast-message');
  
  modal = document.getElementById('modal');
  modalClose = document.getElementById('modal-close');
  modalTitle = document.getElementById('modal-title');
  modalSubtitle = document.getElementById('modal-subtitle');
  modalBody = document.getElementById('modal-body');
  
  backToTopBtn = document.getElementById('back-to-top');
}

// Setup Event Listeners
function setupEventListeners() {
  // Mobile Hamburger Toggle
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
      mobileMenuBtn.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // College Explorer Actions
  const onFilterChange = () => {
    currentPage = 1;
    if (districtFilter.value === 'All' && branchFilter.value === 'All' && tierFilter.value === 'All') {
      // Reset to empty explorer table state
      sortControlsWrapper.style.display = 'none';
      resultsCount.innerText = 'Please select filter parameters to display matching records.';
      resultsBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 4rem 2rem;">
            <i data-lucide="info" style="width: 32px; height: 32px; margin-bottom: 0.75rem; opacity: 0.5;"></i>
            <p>Please select filter parameters above to display matching records.</p>
          </td>
        </tr>
      `;
      pagination.innerHTML = '';
      if (window.lucide) window.lucide.createIcons();
    } else {
      runExplorerQuery();
    }
  };

  yearFilter.addEventListener('change', onFilterChange);
  districtFilter.addEventListener('change', onFilterChange);
  branchFilter.addEventListener('change', onFilterChange);
  tierFilter.addEventListener('change', onFilterChange);
  
  resetFiltersBtn.addEventListener('click', () => {
    yearFilter.value = '2025';
    districtFilter.value = 'All';
    branchFilter.value = 'All';
    tierFilter.value = 'All';
    sortBy.value = 'rank-asc';
    currentPage = 1;
    sortControlsWrapper.style.display = 'none';
    
    resultsCount.innerText = 'Please select filter parameters to display matching records.';
    resultsBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 4rem 2rem;">
          <i data-lucide="info" style="width: 32px; height: 32px; margin-bottom: 0.75rem; opacity: 0.5;"></i>
          <p>Please select filter parameters above to display matching records.</p>
        </td>
      </tr>
    `;
    pagination.innerHTML = '';
    if (window.lucide) window.lucide.createIcons();
  });
  
  sortBy.addEventListener('change', () => {
    currentPage = 1;
    runExplorerQuery();
  });

  // Course Controls
  courseYearFilter.addEventListener('change', () => {
    showAllCourses = false;
    loadBranchExplorer();
  });
  
  courseSearch.addEventListener('input', filterCourseCards);
  
  showMoreCoursesBtn.addEventListener('click', () => {
    showAllCourses = !showAllCourses;
    renderBranchCards();
  });

  // Predictor Chances Button
  predictBtn.addEventListener('click', () => {
    runPredictorQuery();
  });

  // Choice list toolbar
  clearChoicesBtn.addEventListener('click', () => {
    if (choiceList.length === 0) return;
    if (confirm('Are you sure you want to clear your entire choice list?')) {
      choiceList = [];
      saveChoiceList();
      renderChoiceList();
      showToast('Choice list cleared.');
    }
  });

  exportCsvBtn.addEventListener('click', exportChoiceListToCSV);
  exportPdfBtn.addEventListener('click', exportChoiceListToPDF);

  // Modals
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Back to top
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    if (window.scrollY > 500) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
    
    highlightActiveNavSection();
  });
}

// Fetch Dropdown Filters from Backend API
async function loadFiltersData() {
  try {
    const res = await fetch(`${API_BASE}/filters`);
    if (!res.ok) throw new Error('Filters load failed');
    const data = await res.json();

    // Populate Districts
    data.districts.forEach(dist => {
      const text = titleCase(dist);
      districtFilter.appendChild(new Option(text, dist));
      predDistrict.appendChild(new Option(text, dist));
    });

    // Populate Branches
    data.branches.forEach(br => {
      branchFilter.appendChild(new Option(`${br.code} - ${br.name}`, br.code));
      predBranch.appendChild(new Option(`${br.code} - ${br.name}`, br.code));
    });

    // Populate Tiers
    data.tiers.forEach(t => {
      tierFilter.appendChild(new Option(t, t));
      predTier.appendChild(new Option(t, t));
    });
  } catch(err) {
    console.error('Error loading filters dropdowns:', err);
  }
}

// College Explorer API Fetch (Ranks table, no cutoff, 8 columns)
async function runExplorerQuery() {
  resultsBody.innerHTML = '<tr><td colspan="8" style="text-align: center;"><div class="loading-spinner"></div></td></tr>';
  
  const queryParams = new URLSearchParams({
    page: currentPage,
    limit: RESULTS_PER_PAGE,
    year: yearFilter.value,
    district: districtFilter.value,
    branch: branchFilter.value,
    tier: tierFilter.value,
    sortBy: sortBy.value
  });

  try {
    const res = await fetch(`${API_BASE}/colleges?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch explorer data');
    const result = await res.json();
    
    explorerTotal = result.total;
    explorerColleges = result.data;
    
    resultsCount.innerText = `Showing ${explorerTotal.toLocaleString()} matching records`;
    
    // Show sort controls now that we have data loaded
    sortControlsWrapper.style.display = 'flex';
    
    renderExplorerPage();
  } catch (err) {
    resultsBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--reach-color);">Error loading data from server. Please refresh.</td></tr>';
    console.error(err);
  }
}

// Render dynamic rows (without Action Add button and no cutoff)
function renderExplorerPage() {
  resultsBody.innerHTML = '';
  
  if (explorerColleges.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">No matching college admissions found. Check your filters.</td></tr>';
    pagination.innerHTML = '';
    return;
  }

  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  explorerColleges.forEach((row, i) => {
    const rowNumber = offset + i + 1;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color: var(--text-muted); font-weight: 500;">${rowNumber}</td>
      <td><span class="college-code">${row['College Code']}</span></td>
      <td>
        <div class="college-name-cell" title="${row['College Name']}">
          ${shortenCollegeName(row['College Name'])}
        </div>
      </td>
      <td><strong style="color: var(--accent-secondary); cursor: pointer;" onclick="openBranchDetailsModal('${row['Branch Code']}', '${row['Branch Name']}')" title="View Details">${row['Branch Code']}</strong></td>
      <td style="font-family: var(--font-heading);">${row['Opening Cutoff'] ? row['Opening Cutoff'].toFixed(2) : 'N/A'} / <span style="color: var(--text-secondary); font-size: 0.85rem;">${row['Opening Rank'] === null ? 'N/A' : formatNumber(row['Opening Rank'])}</span></td>
      <td style="font-family: var(--font-heading); font-weight: 700; color: var(--text-primary);">${row['Closing Cutoff'] ? row['Closing Cutoff'].toFixed(2) : 'N/A'} / <span style="color: var(--accent-secondary); font-size: 0.9rem;">${row['Closing Rank'] === null ? 'N/A' : formatNumber(row['Closing Rank'])}</span></td>
      <td>${titleCase(row.District)}</td>
      <td><span class="badge-tier">${row['Institution Type']}</span></td>
    `;
    resultsBody.appendChild(tr);
  });

  renderPaginationControls();
  if (window.lucide) window.lucide.createIcons();
}

function renderPaginationControls() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(explorerTotal / RESULTS_PER_PAGE);
  if (totalPages <= 1) return;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = '&larr;';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      runExplorerQuery();
      document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
    }
  });
  pagination.appendChild(prevBtn);

  // Numbers
  for (let p = startPage; p <= endPage; p++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
    pageBtn.innerText = p;
    pageBtn.addEventListener('click', () => {
      currentPage = p;
      runExplorerQuery();
      document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
    });
    pagination.appendChild(pageBtn);
  }

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
  nextBtn.innerHTML = '&rarr;';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      runExplorerQuery();
      document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
    }
  });
  pagination.appendChild(nextBtn);
}

function toggleChoiceListItem(btn, item) {
  const isAdded = isItemInChoiceList(item.collegeCode, item.branchCode);
  
  if (isAdded) {
    const findIdx = choiceList.findIndex(x => x.collegeCode === item.collegeCode && x.branchCode === item.branchCode);
    if (findIdx > -1) {
      choiceList.splice(findIdx, 1);
      saveChoiceList();
      renderChoiceList();
      showToast('Removed from choice list.');
    }
  } else {
    choiceList.push(item);
    saveChoiceList();
    renderChoiceList();
    showToast('Added to choice list!');
  }
  
  refreshChoiceStates();
}

function refreshChoiceStates() {
  if (predictorResults.children.length > 0) {
    updatePredictorButtonStates();
  }
}

function updatePredictorButtonStates() {
  const btns = predictorResults.querySelectorAll('.add-to-choice-btn');
  btns.forEach(btn => {
    const colCode = parseInt(btn.getAttribute('data-code'), 10);
    const branchCode = btn.getAttribute('data-branch');
    const isAdded = isItemInChoiceList(colCode, branchCode);
    btn.className = isAdded ? 'add-to-choice-btn added' : 'add-to-choice-btn';
    btn.innerHTML = isAdded ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Added' : '<i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add';
  });
  if (window.lucide) window.lucide.createIcons();
}

function isItemInChoiceList(collegeCode, branchCode) {
  return choiceList.some(item => item.collegeCode === collegeCode && item.branchCode === branchCode);
}

// Toast
function showToast(message) {
  toastMessage.innerHTML = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// LocalStorage
function saveChoiceList() {
  localStorage.setItem('tnea_choice_list', JSON.stringify(choiceList));
}

function loadChoiceList() {
  const cached = localStorage.getItem('tnea_choice_list');
  if (cached) {
    try {
      choiceList = JSON.parse(cached);
    } catch(e) {
      choiceList = [];
    }
  }
  renderChoiceList();
}

function renderChoiceList() {
  choiceCount.innerText = `${choiceList.length} choices added`;
  choiceListContainer.innerHTML = '';

  if (choiceList.length === 0) {
    choiceListContainer.innerHTML = `
      <div class="choice-empty">
        <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>Your choice list is empty. Add colleges from the Predictor or Course Explorer to start building your priority list.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  choiceList.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'choice-item glass-card';
    div.setAttribute('draggable', 'true');
    div.setAttribute('data-index', index);
    
    div.innerHTML = `
      <span class="choice-rank">${index + 1}</span>
      <div class="choice-details">
        <span class="choice-college" title="${item.collegeName}">${shortenCollegeName(item.collegeName)}</span>
        <span class="choice-branch">${item.branchCode} - ${item.branchName}</span>
        <span class="choice-meta">${titleCase(item.district)} &bull; ${item.tier} &bull; Closing Rank: <strong>${formatNumber(item.rank)}</strong></span>
      </div>
      <div class="choice-item-actions">
        <button class="choice-btn-icon" onclick="moveChoiceUp(${index})" title="Move up"><i data-lucide="arrow-up" style="width: 16px; height: 16px;"></i></button>
        <button class="choice-btn-icon" onclick="moveChoiceDown(${index})" title="Move down"><i data-lucide="arrow-down" style="width: 16px; height: 16px;"></i></button>
        <button class="choice-btn-icon remove" onclick="removeChoiceListItem(${index})" title="Remove"><i data-lucide="trash" style="width: 16px; height: 16px;"></i></button>
      </div>
    `;
    
    setupDragAndDropEvents(div);
    choiceListContainer.appendChild(div);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Drag & Drop Swapping
let dragStartIndex;

function setupDragAndDropEvents(elem) {
  elem.addEventListener('dragstart', () => {
    dragStartIndex = parseInt(elem.getAttribute('data-index'), 10);
    setTimeout(() => elem.classList.add('dragging'), 0);
  });

  elem.addEventListener('dragend', () => elem.classList.remove('dragging'));
  elem.addEventListener('dragover', (e) => e.preventDefault());

  elem.addEventListener('drop', (e) => {
    e.preventDefault();
    const dragEndIndex = parseInt(elem.getAttribute('data-index'), 10);
    swapChoiceItems(dragStartIndex, dragEndIndex);
  });
}

function swapChoiceItems(fromIndex, toIndex) {
  const item = choiceList.splice(fromIndex, 1)[0];
  choiceList.splice(toIndex, 0, item);
  saveChoiceList();
  renderChoiceList();
  refreshChoiceStates();
}

window.moveChoiceUp = function(index) {
  if (index === 0) return;
  swapChoiceItems(index, index - 1);
};

window.moveChoiceDown = function(index) {
  if (index === choiceList.length - 1) return;
  swapChoiceItems(index, index + 1);
};

window.removeChoiceListItem = function(index) {
  choiceList.splice(index, 1);
  saveChoiceList();
  renderChoiceList();
  refreshChoiceStates();
  showToast('Removed from choice list.');
};

// Course Explorer API Fetch
async function loadBranchExplorer() {
  const year = courseYearFilter.value;
  try {
    const res = await fetch(`${API_BASE}/branches?year=${year}`);
    if (!res.ok) throw new Error('Failed to load branches');
    allBranches = await res.json();
    
    renderBranchCards();
  } catch(err) {
    console.error(err);
    courseGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--reach-color);">Error loading courses.</div>';
  }
}

// Render branch cards (Display closing ranks range instead of cutoffs)
function renderBranchCards() {
  const query = courseSearch.value.toLowerCase().trim();
  
  const filtered = allBranches.filter(item => 
    item.code.toLowerCase().includes(query) || 
    item.name.toLowerCase().includes(query)
  );

  const visibleLimit = showAllCourses ? filtered.length : 12;
  const displayList = filtered.slice(0, visibleLimit);

  courseGrid.innerHTML = '';
  displayList.forEach(item => {
    const emoji = getBranchEmoji(item.code);
    const card = document.createElement('div');
    card.className = 'branch-card glass-card';
    
    card.innerHTML = `
      <div class="branch-icon">${emoji}</div>
      <h3 class="branch-name" title="${item.name}">${item.code} - ${shortenBranchName(item.name)}</h3>
      <div class="branch-stats">
        <span class="college-count">Offered in <strong>${item.college_count}</strong> colleges</span>
        <span class="cutoff-range">Closing Ranks: <strong>${formatNumber(item.min_rank)} - ${formatNumber(item.max_rank)}</strong></span>
      </div>
      <button class="btn-outline btn-small" style="font-weight: 600;" onclick="openBranchDetailsModal('${item.code}', '${item.name}')">
        More &rarr;
      </button>
    `;
    courseGrid.appendChild(card);
  });

  // Toggle button visibility
  if (filtered.length <= 12) {
    showMoreCoursesBtn.style.display = 'none';
  } else {
    showMoreCoursesBtn.style.display = 'inline-flex';
    showMoreCoursesBtn.innerHTML = showAllCourses 
      ? '<i data-lucide="chevrons-up"></i> Show Less Branches'
      : '<i data-lucide="chevrons-down"></i> Show More Branches';
  }

  if (window.lucide) window.lucide.createIcons();
}

function filterCourseCards() {
  renderBranchCards();
}

// Modal College Details (Displays rank info, no cutoffs)
window.openBranchDetailsModal = async function(code, name) {
  const year = courseYearFilter.value;
  modalTitle.innerText = `${code} - ${name}`;
  modalSubtitle.innerText = `Colleges offering this course in ${year == 'All' ? '2025' : year}, sorted by closing general rank`;
  modalBody.innerHTML = '<div class="loading-spinner"></div>';
  modal.classList.add('active');

  const queryYear = year == 'All' ? '2025' : year;

  try {
    const res = await fetch(`${API_BASE}/branch-colleges?code=${code}&year=${queryYear}`);
    if (!res.ok) throw new Error('Failed to load colleges for branch');
    const colleges = await res.json();
    
    let tableHtml = `
      <div class="results-container">
        <table class="results-table" style="width: 100%">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>College Name</th>
              <th>Opening Rank</th>
              <th>Closing Rank</th>
              <th>District</th>
              <th style="text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (colleges.length === 0) {
      tableHtml += '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No colleges found offering this course.</td></tr>';
    } else {
      colleges.forEach((col, idx) => {
        const isAdded = isItemInChoiceList(col['College Code'], col['Branch Code']);
        const btnClass = isAdded ? 'add-to-choice-btn added' : 'add-to-choice-btn';
        const btnText = isAdded ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : '<i data-lucide="plus" style="width: 12px; height: 12px;"></i>';
        
        tableHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td><span class="college-code">${col['College Code']}</span></td>
            <td><div class="college-name-cell" title="${col['College Name']}" style="max-width: 320px;">${shortenCollegeName(col['College Name'])}</div></td>
            <td>${col['Opening Rank'] === null ? 'N/A' : formatNumber(col['Opening Rank'])}</td>
            <td style="font-weight: 700; color: var(--accent-secondary);">${col['Closing Rank'] === null ? 'N/A' : formatNumber(col['Closing Rank'])}</td>
            <td>${titleCase(col.District)}</td>
            <td style="text-align: center;">
              <button class="${btnClass}" data-code="${col['College Code']}" data-branch="${col['Branch Code']}" onclick="toggleModalChoiceBtn(this, ${col['College Code']}, '${col['Branch Code']}')" style="padding: 6px 10px;">
                ${btnText}
              </button>
            </td>
          </tr>
        `;
      });
    }

    tableHtml += '</tbody></table></div>';
    modalBody.innerHTML = tableHtml;
    
    if (window.lucide) window.lucide.createIcons();
  } catch(err) {
    modalBody.innerHTML = '<p style="color: var(--reach-color); text-align: center; padding: 2rem;">Failed to load data.</p>';
  }
};

window.toggleModalChoiceBtn = function(btn, colCode, branchCode) {
  // Construct dynamic item
  const tr = btn.closest('tr');
  const closingRank = parseInt(tr.children[4].innerText.replace(/,/g, ''), 10);
  
  const item = {
    collegeCode: colCode,
    collegeName: tr.querySelector('.college-name-cell').getAttribute('title') || 'College',
    branchCode: branchCode,
    branchName: modalTitle.innerText.split(' - ')[1] || 'Branch',
    district: tr.children[5].innerText,
    tier: 'Autonomous Colleges', 
    rank: closingRank
  };
  
  toggleChoiceListItem(btn, item);
  
  const isAdded = isItemInChoiceList(colCode, branchCode);
  btn.className = isAdded ? 'add-to-choice-btn added' : 'add-to-choice-btn';
  btn.innerHTML = isAdded ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : '<i data-lucide="plus" style="width: 12px; height: 12px;"></i>';
  if (window.lucide) window.lucide.createIcons();
};

function closeModal() {
  modal.classList.remove('active');
}

// Cutoff Predictor API Fetch (Calculated on Rank or Cutoff bounds)
async function runPredictorQuery() {
  const rankVal = parseInt(studentRank.value, 10);
  const cutoffVal = parseFloat(studentCutoff.value);
  
  if (isNaN(rankVal) && isNaN(cutoffVal)) {
    alert('Please enter either your TNEA General Rank or your Cutoff Mark to run predictions.');
    return;
  }

  predictorResults.innerHTML = '<div style="text-align: center;"><div class="loading-spinner"></div></div>';

  const params = new URLSearchParams({
    rank: isNaN(rankVal) ? '' : rankVal,
    cutoff: isNaN(cutoffVal) ? '' : cutoffVal,
    district: predDistrict.value,
    branch: predBranch.value,
    tier: predTier.value
  });

  try {
    const res = await fetch(`${API_BASE}/predict?${params}`);
    if (!res.ok) throw new Error('Prediction API failed');
    const result = await res.json();

    renderPredictorGrid(result.safe, result.moderate, result.reach);
  } catch(err) {
    predictorResults.innerHTML = '<div class="glass-card" style="padding: 2rem; text-align: center; color: var(--reach-color);">Error fetching predictions from server.</div>';
  }
}

function renderPredictorGrid(safe, moderate, reach) {
  predictorResults.innerHTML = '';
  
  if (safe.length === 0 && moderate.length === 0 && reach.length === 0) {
    predictorResults.innerHTML = '<div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-secondary);">No predictions found for your inputs. Try broadening your criteria.</div>';
    return;
  }

  const renderCategory = (list, title, categoryClass) => {
    if (list.length === 0) return;
    const categoryDiv = document.createElement('div');
    categoryDiv.className = `pred-category ${categoryClass}`;
    
    let cardsHtml = '';
    list.forEach(row => {
      const isAdded = isItemInChoiceList(row['College Code'], row['Branch Code']);
      const btnClass = isAdded ? 'add-to-choice-btn added' : 'add-to-choice-btn';
      const btnText = isAdded ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Added' : '<i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add';
      
      const hist = row['History'] || {};
      const formatHistYear = (y) => {
        const item = hist[y];
        if (!item) return 'N/A';
        const cutoffText = item.cutoff ? item.cutoff.toFixed(2) : 'N/A';
        const rankText = item.rank ? formatNumber(item.rank) : 'N/A';
        return `Cutoff: <strong style="color: var(--text-primary);">${cutoffText}</strong> | Rank: <strong style="color: var(--text-primary);">${rankText}</strong>`;
      };

      const histHtml = `
        <div class="pred-history" style="display: flex; flex-direction: column; gap: 0.2rem; margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
          <span>2025: ${formatHistYear('2025')}</span>
          <span>2024: ${formatHistYear('2024')}</span>
          <span>2023: ${formatHistYear('2023')}</span>
        </div>
      `;

      cardsHtml += `
        <div class="pred-college-card glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="pred-college-name" title="${row['College Name']}">${shortenCollegeName(row['College Name'])}</div>
            <div class="pred-branch-name">${row['Branch Code']} - ${row['Branch Name']}</div>
            ${histHtml}
          </div>
          <div class="pred-card-footer" style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
            <div class="pred-cutoff-wrapper">
              <span class="pred-cutoff" style="font-size: 0.95rem; color: var(--accent-secondary); font-weight: 700; line-height: 1.4; display: block;">
                Cutoff: ${row['Closing Cutoff'] ? row['Closing Cutoff'].toFixed(2) : 'N/A'} <br>
                Rank: ${formatNumber(row['Closing Rank'])}
              </span>
              <span class="pred-meta" style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${titleCase(row.District)} &bull; ${row['Institution Type']}</span>
            </div>
            <button class="${btnClass}" 
                    data-code="${row['College Code']}" 
                    data-name="${row['College Name']}" 
                    data-branch-code="${row['Branch Code']}" 
                    data-branch-name="${row['Branch Name']}" 
                    data-district="${row['District']}" 
                    data-tier="${row['Institution Type']}" 
                    data-rank="${row['Closing Rank']}" 
                    onclick="togglePredictorChoiceBtn(this)">
              ${btnText}
            </button>
          </div>
        </div>
      `;
    });

    categoryDiv.innerHTML = `
      <h3>${title} (${list.length} matches)</h3>
      <div class="pred-cards-grid">${cardsHtml}</div>
    `;
    predictorResults.appendChild(categoryDiv);
  };

  renderCategory(safe, 'Safe Options 🟢', 'safe-category');
  renderCategory(moderate, 'Moderate / Target Options 🟡', 'moderate-category');
  renderCategory(reach, 'Reach Options 🔴', 'reach-category');

  if (window.lucide) window.lucide.createIcons();
}

window.togglePredictorChoiceBtn = function(btn) {
  const dataset = btn.dataset;
  const item = {
    collegeCode: parseInt(dataset.code, 10),
    collegeName: dataset.name,
    branchCode: dataset.branchCode,
    branchName: dataset.branchName,
    district: dataset.district,
    tier: dataset.tier,
    rank: parseInt(dataset.rank, 10)
  };

  toggleChoiceListItem(btn, item);
};

// Export Handlers (Excluding cutoffs)
function exportChoiceListToCSV() {
  if (choiceList.length === 0) return alert('Choice list is empty.');
  let csv = 'Priority,College Code,College Name,Branch Code,Branch Name,District,Tier,Closing Rank\n';
  choiceList.forEach((item, idx) => {
    csv += `${idx + 1},${item.collegeCode},"${item.collegeName.replace(/"/g, '""')}",${item.branchCode},"${item.branchName.replace(/"/g, '""')}",${item.district},"${item.tier.replace(/"/g, '""')}",${item.rank || 'N/A'}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'TNEA_Choice_List.csv';
  link.click();
}

function exportChoiceListToPDF() {
  if (choiceList.length === 0) return alert('Choice list is empty.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primaryColor = [79, 70, 229];

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TNEA Counselling Choice List', 14, 20);

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })} | Total Choices: ${choiceList.length}`, 14, 26);
  doc.line(14, 29, 196, 29);

  let y = 38;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('#', 16, y + 5);
  doc.text('Code', 22, y + 5);
  doc.text('College Name', 34, y + 5);
  doc.text('Branch', 125, y + 5);
  doc.text('Closing Rank', 148, y + 5);
  doc.text('District', 174, y + 5);
  y += 8;

  doc.setTextColor(17, 24, 39);
  choiceList.forEach((item, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('#', 16, y + 5);
      doc.text('Code', 22, y + 5);
      doc.text('College Name', 34, y + 5);
      doc.text('Branch', 125, y + 5);
      doc.text('Closing Rank', 148, y + 5);
      doc.text('District', 174, y + 5);
      y += 8;
      doc.setTextColor(17, 24, 39);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, 182, 7, 'F');
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text((idx + 1).toString(), 16, y + 5);
    doc.text(item.collegeCode.toString(), 22, y + 5);
    
    const colName = shortenCollegeName(item.collegeName);
    const shortCol = doc.splitTextToSize(colName, 88);
    doc.text(shortCol[0], 34, y + 5);
    
    doc.text(item.branchCode, 125, y + 5);
    doc.text(item.rank ? formatNumber(item.rank) : 'N/A', 148, y + 5);
    doc.text(titleCase(item.district), 174, y + 5);
    y += 7;
  });

  doc.save('TNEA_Choice_List.pdf');
}

// Scroll layout handlers
function setupScrollEffects() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.05 });
  sections.forEach(sec => {
    sec.classList.add('fade-in');
    observer.observe(sec);
  });
}

function highlightActiveNavSection() {
  const sections = document.querySelectorAll('section');
  const scrollPos = window.scrollY + 120;
  sections.forEach(section => {
    if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      const id = section.getAttribute('id');
      navLinks.querySelectorAll('a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${id}`) a.classList.add('active');
      });
    }
  });
}

// Hero animations
function runHeroAnimations() {
  const statValues = document.querySelectorAll('.stat-value');
  statValues.forEach(elem => {
    const target = parseInt(elem.getAttribute('data-target'), 10);
    let count = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    
    const updateCount = () => {
      count += increment;
      if (count < target) {
        elem.innerText = Math.floor(count).toLocaleString();
        requestAnimationFrame(updateCount);
      } else {
        elem.innerText = target.toLocaleString();
      }
    };
    updateCount();
  });
}

// Utilities
function shortenCollegeName(name) {
  if (!name) return '';
  const commaIdx = name.indexOf(',');
  if (commaIdx > 0) {
    const part = name.substring(0, commaIdx).trim();
    return part.length > 65 ? part.substring(0, 62) + '...' : part;
  }
  return name.length > 60 ? name.substring(0, 57) + '...' : name;
}

function shortenBranchName(name) {
  if (!name) return '';
  return name.length > 35 ? name.substring(0, 32) + '...' : name;
}

function formatNumber(num) {
  if (num === null || isNaN(num)) return 'N/A';
  return parseInt(num, 10).toLocaleString('en-IN');
}

async function loadDynamicHeroStats() {
  try {
    const res = await fetch(`${API_BASE}/dash-summary`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    
    const colHero = document.getElementById('hero-stat-colleges');
    const brHero = document.getElementById('hero-stat-branches');
    const yrHero = document.getElementById('hero-stat-years');
    
    if (colHero) colHero.setAttribute('data-target', data.metrics.colleges);
    if (brHero) brHero.setAttribute('data-target', data.metrics.branches);
    if (yrHero) yrHero.setAttribute('data-target', data.metrics.years);
  } catch (err) {
    console.error('Failed to load dynamic hero stats:', err);
  } finally {
    runHeroAnimations();
  }
}

function titleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getBranchEmoji(code) {
  const c = code.toUpperCase();
  if (c.includes('CS') || c === 'IT' || c.includes('SE')) return '💻';
  if (c === 'EC' || c.includes('VLSI') || c.includes('AE')) return '📡';
  if (c === 'EE' || c.includes('EN')) return '⚡';
  if (c === 'ME' || c.includes('MF') || c.includes('IE')) return '⚙️';
  if (c === 'CE') return '🏗️';
  if (c === 'BT' || c.includes('PH')) return '🧬';
  if (c === 'AD' || c === 'AI' || c.includes('DS') || c.includes('ML')) return '🤖';
  if (c.includes('CH') || c === 'PE') return '🧪';
  return '🎓';
}
