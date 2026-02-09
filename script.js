const API_KEY = "d5585837c92af34f108abad6a1e84115";
const container = document.getElementById("movies");

let page = 1;
let mode = "popular";
let loading = false;
let favorites = JSON.parse(localStorage.getItem("favorites")) || {};
let filters = { year:"", rating:"", genre:"" };

/* PLAYER */
function openPlayer(id){
  document.getElementById("videasyPlayer").src =
    `https://player.videasy.net/movie/${id}`;
  document.getElementById("playerModal").style.display="flex";
}
function closePlayer(){
  document.getElementById("videasyPlayer").src="";
  document.getElementById("playerModal").style.display="none";
}

/* FETCH */
async function fetchMovies(reset=false){
  if(loading) return;
  loading = true;

  if(reset){
    page=1;
    container.innerHTML="";
  }

  let url;
  if(mode==="discover"){
    url=`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${page}`;
    if(filters.year) url+=`&primary_release_year=${filters.year}`;
    if(filters.rating) url+=`&vote_average.gte=${filters.rating}`;
    if(filters.genre) url+=`&with_genres=${filters.genre}`;
  } else {
    url=`https://api.themoviedb.org/3/movie/${mode}?api_key=${API_KEY}&page=${page}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  data.results.forEach(m=>{
    if(!m.poster_path) return;
    const fav = favorites[m.id];
    container.innerHTML+=`
      <div class="card">
        <img src="https://image.tmdb.org/t/p/w500${m.poster_path}"
             onclick="openPlayer(${m.id})">
        <h3>${m.title}</h3>
        <button onclick="toggleFav(${m.id})">${fav?"❤️":"🤍"}</button>
      </div>`;
  });

  page++;
  loading=false;
}

/* TABS */
function setTab(t,el){
  document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
  el.classList.add("active");
  mode=t;
  fetchMovies(true);
}

/* SEARCH */
async function searchMovies(){
  const q=document.getElementById("searchInput").value.trim();
  if(!q) return;
  container.innerHTML="";
  const r=await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}`
  );
  const d=await r.json();
  d.results.forEach(m=>{
    if(!m.poster_path) return;
    container.innerHTML+=`
      <div class="card">
        <img src="https://image.tmdb.org/t/p/w500${m.poster_path}"
             onclick="openPlayer(${m.id})">
        <h3>${m.title}</h3>
      </div>`;
  });
}

/* FILTERS */
function applyFilters(){
  filters.year=document.getElementById("yearFilter").value;
  filters.rating=document.getElementById("ratingFilter").value;
  filters.genre=document.getElementById("genreFilter").value;
  mode="discover";
  fetchMovies(true);
}

/* FAVORITES */
function toggleFav(id){
  favorites[id]=!favorites[id];
  localStorage.setItem("favorites",JSON.stringify(favorites));
}

/* GENRES */
fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`)
  .then(r=>r.json())
  .then(d=>{
    const g=document.getElementById("genreFilter");
    d.genres.forEach(x=>{
      g.innerHTML+=`<option value="${x.id}">${x.name}</option>`;
    });
  });

/* SCROLL */
window.addEventListener("scroll",()=>{
  if(window.innerHeight+scrollY>=document.body.offsetHeight-300){
    fetchMovies();
  }
});

/* INIT */
fetchMovies();

