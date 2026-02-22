const API_KEY = "d5585837c92af34f108abad6a1e84115";
 
 

let type = "movie";
let currentSeriesId = null;
let searchTimeout = null;

/* DOM */
const hero = document.getElementById("hero");
const row = document.getElementById("popularRow");
const playerModal = document.getElementById("playerModal");
const seriesModal = document.getElementById("seriesModal");
const playerFrame = document.getElementById("playerFrame");

const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const yearInput = document.getElementById("yearInput");

/* TOGGLE TYPE */
document.getElementById("movieBtn").onclick = ()=>switchType("movie");
document.getElementById("tvBtn").onclick = ()=>switchType("tv");
document.getElementById("closePlayer").onclick = closePlayer;
document.getElementById("closeSeries").onclick = ()=>seriesModal.style.display="none";

function switchType(newType){
  type=newType;

  document.getElementById("movieBtn").classList.remove("active");
  document.getElementById("tvBtn").classList.remove("active");
  document.getElementById(type==="movie"?"movieBtn":"tvBtn").classList.add("active");

  searchInput.value="";
  genreSelect.value="";
  yearInput.value="";

  loadGenres();
  loadPopular();
}

/* SMART AUTO SEARCH (DEBOUNCE) */
searchInput.addEventListener("input", ()=>{
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(()=>{
    applyAllFilters();
  }, 500);
});

genreSelect.addEventListener("change", applyAllFilters);
yearInput.addEventListener("input", ()=>{
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(()=>{
    applyAllFilters();
  }, 500);
});

/* MAIN LOGIC */
async function applyAllFilters(){

  const query = searchInput.value.trim();
  const genre = genreSelect.value;
  const year = yearInput.value;

  let url = "";

  if(query){
    url = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${query}`;
  } else {
    url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}`;
  }

  if(genre) url += `&with_genres=${genre}`;

  if(year){
    if(type==="movie")
      url += `&primary_release_year=${year}`;
    else
      url += `&first_air_date_year=${year}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  renderResults(data.results);

  if(!query && data.results.length > 0){
    loadHero(data.results[0]);
  }
}

/* LOAD POPULAR DEFAULT */
async function loadPopular(){
  const res = await fetch(
    `https://api.themoviedb.org/3/${type}/popular?api_key=${API_KEY}`
  );
  const data = await res.json();

  renderResults(data.results);
  loadHero(data.results[0]);
}

/* HERO */
function loadHero(item){
  hero.style.backgroundImage =
    `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;

  hero.innerHTML = `
    <div class="hero-content">
      <h1>${type==="movie"?item.title:item.name}</h1>
      <button onclick="openMain(${item.id})">Play</button>
    </div>`;
}

/* GENRES */
async function loadGenres(){
  const res = await fetch(
    `https://api.themoviedb.org/3/genre/${type}/list?api_key=${API_KEY}`
  );
  const data = await res.json();

  genreSelect.innerHTML = `<option value="">Genre</option>`;
  data.genres.forEach(g=>{
    genreSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
  });
}

/* RENDER */
function renderResults(items){
  row.innerHTML="";
  items.forEach(item=>{
    if(!item.poster_path) return;

    const img=document.createElement("img");
    img.src=`https://image.tmdb.org/t/p/w500${item.poster_path}`;

    img.onclick=()=>{
      if(type==="movie") openMain(item.id);
      else openSeries(item.id);
    };

    row.appendChild(img);
  });
}

/* PLAYER */
function openMain(id,season=1,episode=1){
  if(type==="movie")
    playerFrame.src=`https://player.videasy.net/movie/${id}`;
  else
    playerFrame.src=`https://player.videasy.net/tv/${id}/${season}/${episode}`;

  playerModal.style.display="flex";
}

function closePlayer(){
  playerFrame.src="";
  playerModal.style.display="none";
}

/* SERIES */
async function openSeries(id){
  currentSeriesId=id;

  const res=await fetch(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`
  );
  const data=await res.json();

  document.getElementById("seriesTitle").innerText=data.name;

  const seasonTabs=document.getElementById("seasonTabs");
  const grid=document.getElementById("episodeGrid");

  seasonTabs.innerHTML="";
  grid.innerHTML="";

  data.seasons.forEach(season=>{
    if(season.season_number===0) return;

    const btn=document.createElement("button");
    btn.textContent=`Season ${season.season_number}`;
    btn.onclick=()=>loadSeason(season.season_number);
    seasonTabs.appendChild(btn);
  });

  seriesModal.style.display="flex";
}

async function loadSeason(seasonNumber){
  const res=await fetch(
    `https://api.themoviedb.org/3/tv/${currentSeriesId}/season/${seasonNumber}?api_key=${API_KEY}`
  );
  const data=await res.json();

  const grid=document.getElementById("episodeGrid");
  grid.innerHTML="";

  data.episodes.forEach(ep=>{
    const card=document.createElement("div");
    card.className="episode-card";

    const imgPath=ep.still_path
      ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
      : "https://via.placeholder.com/500x300?text=No+Image";

    card.innerHTML=`
      <img src="${imgPath}">
      <div><strong>Ep ${ep.episode_number}</strong><br>${ep.name}</div>
    `;

    card.onclick=()=>{
      openMain(currentSeriesId,seasonNumber,ep.episode_number);
      seriesModal.style.display="none";
    };

    grid.appendChild(card);
  });
}

loadPopular();
loadGenres();

