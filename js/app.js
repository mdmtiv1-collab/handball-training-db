// Global Application State
let drills = [];
let activeFilters = {
  category: 'all',
  difficulty: 'all',
  search: ''
};
let sortBy = 'id';
let currentPlanner = [];

// DOM Elements
const drillsGrid = document.getElementById('drillsGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilterContainer = document.getElementById('categoryFilters');
const difficultyFilterContainer = document.getElementById('difficultyFilters');
const sortSelect = document.getElementById('sortSelect');
const activeCategoryName = document.getElementById('activeCategoryName');
const drillsCountDisplay = document.getElementById('drillsCount');
const totalDrillsCountDisplay = document.getElementById('totalDrillsCount');

// Modal Elements
const drillModal = document.getElementById('drillModal');
const modalClose = document.getElementById('modalClose');
const modalVideoContainer = document.getElementById('modalVideoContainer');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDifficulty = document.getElementById('modalDifficulty');
const modalObjective = document.getElementById('modalObjective');
const modalDescription = document.getElementById('modalDescription');
const modalMaterials = document.getElementById('modalMaterials');
const modalPlayers = document.getElementById('modalPlayers');
const modalDuration = document.getElementById('modalDuration');
const modalYoutubeBtn = document.getElementById('modalYoutubeBtn');

// Planner Drawer Elements
const plannerDrawer = document.getElementById('plannerDrawer');
const openPlannerBtn = document.getElementById('openPlannerBtn');
const closePlannerBtn = document.getElementById('closePlannerBtn');
const plannerList = document.getElementById('plannerList');
const emptyPlannerState = document.getElementById('emptyPlannerState');
const plannerBadge = document.getElementById('plannerBadge');
const printBtn = document.getElementById('printBtn');
const clearPlannerBtn = document.getElementById('clearPlannerBtn');
const totalTimeDisplay = document.getElementById('totalTime');
const minPlayersDisplay = document.getElementById('minPlayers');

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.handballDrills || !Array.isArray(window.handballDrills)) {
      throw new Error('Banco de dados de treinos não encontrado.');
    }
    drills = window.handballDrills;
    
    // Load planner from LocalStorage
    loadPlannerFromStorage();
    
    // Initialize filters, category list and render
    renderCategoryFilters();
    renderDifficultyFilters();
    filterAndRender();
    updateStats();
    
    // Event Listeners
    setupEventListeners();
  } catch (error) {
    console.error('Erro na inicialização:', error);
    drillsGrid.innerHTML = `
      <div class="empty-results">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3>Erro ao Carregar Exercícios</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Setup Event Listeners
function setupEventListeners() {
  // Search Input
  searchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value.toLowerCase().trim();
    filterAndRender();
  });
  
  // Sort Selection
  sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    filterAndRender();
  });
  
  // Modal Close
  modalClose.addEventListener('click', closeModal);
  drillModal.addEventListener('click', (e) => {
    if (e.target === drillModal) closeModal();
  });
  
  // Esc Key to close Modals and Drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      plannerDrawer.classList.remove('open');
    }
  });
  
  // Planner Drawer Toggles
  openPlannerBtn.addEventListener('click', () => plannerDrawer.classList.add('open'));
  closePlannerBtn.addEventListener('click', () => plannerDrawer.classList.remove('open'));
  
  // Print Planner
  printBtn.addEventListener('click', printTrainingSession);
  
  // Clear Planner
  clearPlannerBtn.addEventListener('click', () => {
    if (confirm('Deseja limpar todos os treinos selecionados?')) {
      currentPlanner = [];
      savePlannerToStorage();
      renderPlanner();
    }
  });
}

// Render dynamic Category Filters and Counts
function renderCategoryFilters() {
  const categories = ['all', ...new Set(drills.map(d => d.categoria))];
  categoryFilterContainer.innerHTML = '';
  
  categories.forEach(cat => {
    const count = cat === 'all' ? drills.length : drills.filter(d => d.categoria === cat).length;
    const btn = document.createElement('button');
    btn.className = `filter-btn ${cat === activeFilters.category ? 'active' : ''}`;
    btn.dataset.category = cat;
    
    const displayName = cat === 'all' ? 'Todos os Treinos' : cat;
    btn.innerHTML = `
      <span>${displayName}</span>
      <span class="drill-count">${count}</span>
    `;
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('#categoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.category = cat;
      activeCategoryName.textContent = displayName;
      filterAndRender();
    });
    
    categoryFilterContainer.appendChild(btn);
  });
}

// Render dynamic Difficulty Filters and Counts
function renderDifficultyFilters() {
  const difficulties = ['all', 'Iniciação', 'Intermediário', 'Avançado'];
  difficultyFilterContainer.innerHTML = '';
  
  difficulties.forEach(diff => {
    const count = diff === 'all' ? drills.length : drills.filter(d => d.dificuldade === diff).length;
    const btn = document.createElement('button');
    btn.className = `filter-btn ${diff === activeFilters.difficulty ? 'active' : ''}`;
    btn.dataset.difficulty = diff;
    
    const displayName = diff === 'all' ? 'Todas as Dificuldades' : diff;
    btn.innerHTML = `
      <span>${displayName}</span>
      <span class="drill-count">${count}</span>
    `;
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficultyFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.difficulty = diff;
      filterAndRender();
    });
    
    difficultyFilterContainer.appendChild(btn);
  });
}

// Filter and Render Cards Grid
function filterAndRender() {
  let filtered = drills.filter(drill => {
    const matchCategory = activeFilters.category === 'all' || drill.categoria === activeFilters.category;
    const matchDifficulty = activeFilters.difficulty === 'all' || drill.dificuldade === activeFilters.difficulty;
    const matchSearch = drill.titulo.toLowerCase().includes(activeFilters.search) || 
                        drill.descricao.toLowerCase().includes(activeFilters.search) ||
                        drill.objetivo.toLowerCase().includes(activeFilters.search) ||
                        drill.materiais.toLowerCase().includes(activeFilters.search);
                        
    return matchCategory && matchDifficulty && matchSearch;
  });
  
  // Sort operations
  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.titulo.localeCompare(b.titulo);
    } else if (sortBy === 'difficulty') {
      const rank = { 'Iniciação': 1, 'Intermediário': 2, 'Avançado': 3 };
      return rank[a.dificuldade] - rank[b.dificuldade];
    } else if (sortBy === 'players') {
      return a.jogadores_min - b.jogadores_min;
    } else {
      return a.id - b.id; // default
    }
  });
  
  drillsCountDisplay.textContent = filtered.length;
  
  if (filtered.length === 0) {
    drillsGrid.innerHTML = `
      <div class="empty-results">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <h3>Nenhum exercício encontrado</h3>
        <p>Tente ajustar os termos da busca ou redefinir os filtros.</p>
      </div>
    `;
    return;
  }
  
  drillsGrid.innerHTML = '';
  filtered.forEach(drill => {
    const card = document.createElement('div');
    card.className = 'drill-card';
    card.dataset.id = drill.id;
    
    const isAdded = currentPlanner.some(p => p.id === drill.id);
    const difficultyClass = `difficulty-${drill.dificuldade.toLowerCase()}`;
    
    card.innerHTML = `
      <div class="drill-header">
        <span class="drill-category">${drill.categoria}</span>
        <span class="drill-difficulty ${difficultyClass}">${drill.dificuldade}</span>
      </div>
      <div>
        <h4>${drill.titulo}</h4>
        <div class="drill-meta">
          <div class="meta-item">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            <span>${drill.duracao}</span>
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <span>${drill.jogadores_min}+ jogadores</span>
          </div>
        </div>
      </div>
      <p class="drill-objective">${drill.objetivo}</p>
      <div class="drill-footer">
        <button class="btn btn-primary" onclick="openDrillDetails(${drill.id})">Ver Exercício</button>
        <button class="btn btn-outline btn-icon-only ${isAdded ? 'active-planner' : ''}" onclick="togglePlannerItem(${drill.id}, this)" title="${isAdded ? 'Remover da sessão' : 'Adicionar à sessão'}">
          ${isAdded ? '✕' : '+'}
        </button>
      </div>
    `;
    drillsGrid.appendChild(card);
  });
}

// Update Global Counts
function updateStats() {
  totalDrillsCountDisplay.textContent = drills.length;
}

// Open Drill Detailed Modal
function openDrillDetails(id) {
  const drill = drills.find(d => d.id === id);
  if (!drill) return;
  
  modalTitle.textContent = drill.titulo;
  modalCategory.textContent = drill.categoria;
  modalDifficulty.textContent = drill.dificuldade;
  modalDifficulty.className = `drill-difficulty difficulty-${drill.dificuldade.toLowerCase()}`;
  
  modalObjective.textContent = drill.objetivo;
  modalDescription.textContent = drill.descricao;
  modalPlayers.textContent = `${drill.jogadores_min}+ jogadores`;
  modalDuration.textContent = drill.duracao;
  
  // Render materials
  modalMaterials.innerHTML = '';
  drill.materiais.split(',').forEach(mat => {
    const li = document.createElement('li');
    li.textContent = mat.trim();
    modalMaterials.appendChild(li);
  });
  
  // Set up video / Youtube search helper
  if (drill.youtube_embed_id) {
    modalVideoContainer.style.display = 'block';
    modalVideoContainer.innerHTML = `
      <iframe src="https://www.youtube.com/embed/${drill.youtube_embed_id}" 
              title="${drill.titulo}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen></iframe>
    `;
  } else {
    modalVideoContainer.style.display = 'none';
  }
  
  modalYoutubeBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(drill.youtube_search_term)}`;
  
  drillModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  drillModal.classList.remove('open');
  modalVideoContainer.innerHTML = ''; // Stop video play
  document.body.style.overflow = '';
}

// Planner Lógica
function togglePlannerItem(id, btnElement) {
  const drill = drills.find(d => d.id === id);
  if (!drill) return;
  
  const index = currentPlanner.findIndex(p => p.id === id);
  
  if (index === -1) {
    currentPlanner.push(drill);
    if (btnElement) {
      btnElement.textContent = '✕';
      btnElement.classList.add('active-planner');
    }
  } else {
    currentPlanner.splice(index, 1);
    if (btnElement) {
      btnElement.textContent = '+';
      btnElement.classList.remove('active-planner');
    }
  }
  
  savePlannerToStorage();
  renderPlanner();
  
  // Re-render cards to reflect state if drawer isn't visual source
  filterAndRender();
}

function removePlannerItem(id) {
  currentPlanner = currentPlanner.filter(p => p.id !== id);
  savePlannerToStorage();
  renderPlanner();
  filterAndRender();
}

function movePlannerItem(index, direction) {
  if (direction === 'up' && index > 0) {
    const temp = currentPlanner[index];
    currentPlanner[index] = currentPlanner[index - 1];
    currentPlanner[index - 1] = temp;
  } else if (direction === 'down' && index < currentPlanner.length - 1) {
    const temp = currentPlanner[index];
    currentPlanner[index] = currentPlanner[index + 1];
    currentPlanner[index + 1] = temp;
  }
  savePlannerToStorage();
  renderPlanner();
}

function renderPlanner() {
  plannerBadge.textContent = currentPlanner.length;
  
  if (currentPlanner.length === 0) {
    emptyPlannerState.style.display = 'flex';
    plannerList.style.display = 'none';
    printBtn.disabled = true;
    clearPlannerBtn.disabled = true;
    
    totalTimeDisplay.textContent = '0 min';
    minPlayersDisplay.textContent = '0';
    return;
  }
  
  emptyPlannerState.style.display = 'none';
  plannerList.style.display = 'flex';
  printBtn.disabled = false;
  clearPlannerBtn.disabled = false;
  
  plannerList.innerHTML = '';
  
  let totalTime = 0;
  let maxMinPlayers = 0;
  
  currentPlanner.forEach((drill, index) => {
    // Parse time
    const timeMatch = drill.duracao.match(/\d+/);
    const timeVal = timeMatch ? parseInt(timeMatch[0]) : 10;
    totalTime += timeVal;
    
    if (drill.jogadores_min > maxMinPlayers) {
      maxMinPlayers = drill.jogadores_min;
    }
    
    const li = document.createElement('li');
    li.className = 'planner-item';
    li.innerHTML = `
      <div class="planner-item-details">
        <div class="planner-item-title">${drill.titulo}</div>
        <div class="planner-item-meta">
          <span>⏱ ${drill.duracao}</span>
          <span>👥 ${drill.jogadores_min}+ jog.</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <button class="remove-planner-item" onclick="movePlannerItem(${index}, 'up')" ${index === 0 ? 'disabled' : ''} style="color: var(--accent);">▲</button>
        <button class="remove-planner-item" onclick="movePlannerItem(${index}, 'down')" ${index === currentPlanner.length - 1 ? 'disabled' : ''} style="color: var(--accent);">▼</button>
      </div>
      <button class="remove-planner-item" onclick="removePlannerItem(${drill.id})">✕</button>
    `;
    plannerList.appendChild(li);
  });
  
  totalTimeDisplay.textContent = `${totalTime} min`;
  minPlayersDisplay.textContent = `${maxMinPlayers}`;
}

// LocalStorage Persistence
function savePlannerToStorage() {
  localStorage.setItem('handball_planner_session', JSON.stringify(currentPlanner));
}

function loadPlannerFromStorage() {
  const data = localStorage.getItem('handball_planner_session');
  if (data) {
    try {
      currentPlanner = JSON.parse(data);
    } catch (e) {
      currentPlanner = [];
    }
  }
}

// Print & Export Layout Generator
function printTrainingSession() {
  // Dynamically build and format a beautiful printable container hidden in standard viewport
  let printSection = document.getElementById('printSection');
  if (!printSection) {
    printSection = document.createElement('div');
    printSection.id = 'printSection';
    printSection.className = 'print-layout';
    printSection.style.display = 'none';
    document.body.appendChild(printSection);
  }
  
  let totalTime = 0;
  let maxMinPlayers = 0;
  let drillsHtml = '';
  
  currentPlanner.forEach((drill, index) => {
    const timeMatch = drill.duracao.match(/\d+/);
    totalTime += timeMatch ? parseInt(timeMatch[0]) : 10;
    if (drill.jogadores_min > maxMinPlayers) maxMinPlayers = drill.jogadores_min;
    
    drillsHtml += `
      <div class="print-drill-item" style="border-bottom: 2px solid #e2e8f0; padding: 1.5rem 0; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0;">#${index + 1} - ${drill.titulo}</h2>
          <span style="background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: #475569;">
            ${drill.categoria}
          </span>
        </div>
        <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.875rem; color: #475569; font-weight: 500;">
          <div><strong>⏱ Duração:</strong> ${drill.duracao}</div>
          <div><strong>👥 Mín. Jogadores:</strong> ${drill.jogadores_min}</div>
          <div><strong>⚡ Dificuldade:</strong> ${drill.dificuldade}</div>
        </div>
        <div style="margin-bottom: 0.75rem; line-height: 1.6;">
          <strong style="color: #0f172a; display: block; margin-bottom: 0.25rem;">Objetivo:</strong>
          <span style="color: #334155;">${drill.objetivo}</span>
        </div>
        <div style="margin-bottom: 0.75rem; line-height: 1.6;">
          <strong style="color: #0f172a; display: block; margin-bottom: 0.25rem;">Descrição / Execução:</strong>
          <span style="color: #334155;">${drill.descricao}</span>
        </div>
        <div style="line-height: 1.6;">
          <strong style="color: #0f172a; display: block; margin-bottom: 0.25rem;">Materiais Recomendados:</strong>
          <span style="color: #475569;">${drill.materiais}</span>
        </div>
      </div>
    `;
  });
  
  const today = new Date().toLocaleDateString('pt-BR');
  printSection.innerHTML = `
    <div style="border-bottom: 3px solid #ff5e2b; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin: 0;">Plano de Treinamento de Handebol</h1>
        <p style="font-size: 1rem; color: #64748b; margin: 0.25rem 0 0 0;">Ficha técnica de preparação física e tática</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">Data: ${today}</div>
        <div style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Sessão com ${currentPlanner.length} Exercícios</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem;">
      <div style="text-align: center;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Duração Total</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #ff5e2b; margin-top: 0.25rem;">${totalTime} minutos</div>
      </div>
      <div style="text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Mínimo de Atletas</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">${maxMinPlayers} jogadores</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Responsável Técnico</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">Técnico / Treinador</div>
      </div>
    </div>
    
    <div>
      ${drillsHtml}
    </div>
    
    <div style="margin-top: 3rem; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 1.5rem; font-size: 0.75rem; color: #94a3b8;">
      Gerado via Handball Training Database & Planner - Quadra Inteligente.
    </div>
  `;
  
  window.print();
}
