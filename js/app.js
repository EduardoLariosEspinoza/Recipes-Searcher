function iniciarApp() {
  const selectCategorias = document.querySelector("#categorias");
  const favoritosDiv = document.querySelector(".favoritos");
  const resultado = document.querySelector("#resultado");

  if (selectCategorias) {
    selectCategorias.addEventListener("change", selectCategoria);

    obtenerCategorias();
  }

  if (favoritosDiv) {
    obtenerFavoritos();
  }

  // Crear una instancia de un objeto modal de bootstrap que toma al elemento con el id de "modal" para que sea la ventana emergente
  const modal = new bootstrap.Modal("#modal", {}); // Si no existe un elemento con el id de "modal" no se crea la instancia

  function obtenerCategorias() {
    const url = "https://www.themealdb.com/api/json/v1/1/categories.php";

    fetch(url)
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        mostrarCategorias(resultado.categories);
      });
  }

  function mostrarCategorias(categorias = []) {
    categorias.forEach((categoria) => {
      const { strCategory } = categoria;
      const option = document.createElement("option");
      option.value = strCategory;
      option.textContent = strCategory;
      selectCategorias.appendChild(option);
    });
  }

  function selectCategoria(e) {
    const categoria = e.target.value;

    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

    fetch(url)
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        mostrarRecetas(resultado.meals);
      });
  }

  function mostrarRecetas(recetas = []) {
    limpiarHTML(resultado);

    const heading = document.createElement("H2");
    heading.classList.add("text-center", "text-black", "my-5");
    heading.textContent = recetas.length ? "Resultados" : "No hay resultados";
    resultado.appendChild(heading);

    recetas.forEach((receta) => {
      const { strMeal, strMealThumb, idMeal } = receta;

      const recetaContenedor = document.createElement("div");
      recetaContenedor.classList.add("col-md-4");

      const recetaCard = document.createElement("div");
      recetaCard.classList.add("card", "mb-4");

      const recetaImagen = document.createElement("img");
      recetaImagen.classList.add("card-img-top");
      recetaImagen.alt = `Imagen de ${strMeal ?? receta.titulo}`;
      recetaImagen.src = strMealThumb ?? receta.img;

      const recetaCardBody = document.createElement("div");
      recetaCardBody.classList.add("card-body");

      const recetaHeading = document.createElement("h3");
      recetaHeading.classList.add("card-title");
      recetaHeading.textContent = strMeal ?? receta.titulo;

      const recetaButton = document.createElement("BUTTON");
      recetaButton.classList.add("btn", "btn-danger", "w-100");
      recetaButton.textContent = "Ver receta";
      /* recetaButton.dataset.bsTarget = "#modal";
      recetaButton.dataset.bsToggle = "modal"; */
      recetaButton.onclick = () => {
        seleccionarReceta(idMeal ?? receta.id);
      };

      // Insertar elementos
      recetaCardBody.appendChild(recetaHeading);
      recetaCardBody.appendChild(recetaButton);

      recetaCard.appendChild(recetaImagen);
      recetaCard.appendChild(recetaCardBody);

      recetaContenedor.appendChild(recetaCard);

      resultado.appendChild(recetaContenedor);
    });
  }

  function seleccionarReceta(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

    fetch(url)
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        mostrarRecetaModal(resultado.meals[0]);
      });
  }

  function mostrarRecetaModal(receta) {
    const { idMeal, strMeal, strMealThumb, strInstructions } = receta;

    const modalTitle = document.querySelector(".modal .modal-title");
    const modalBody = document.querySelector(".modal .modal-body");

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
    <img src="${strMealThumb}" alt="Imagen de ${strMeal}" class="img-fluid">
    <h3 class="my-3">Instrucciones</h3>
    <p>${strInstructions}</p>
    <h3 class="my-3">Ingredientes y cantidades</h3>
    `;

    const listGroup = document.createElement("UL");
    listGroup.classList.add("list-group");

    for (let i = 0; i <= 20; i++) {
      if (receta[`strIngredient${i}`]) {
        const ingrediente = receta[`strIngredient${i}`];
        const cantidad = receta[`strMeasure${i}`];

        const ingredienteLi = document.createElement("LI");
        ingredienteLi.classList.add("list-group-item");
        ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

        listGroup.appendChild(ingredienteLi);
      }
    }

    modalBody.appendChild(listGroup);

    const modalFooter = document.querySelector(".modal-footer");

    limpiarHTML(modalFooter);

    const btnFavorito = document.createElement("BUTTON");
    btnFavorito.classList.add("btn", "btn-danger", "col");
    btnFavorito.textContent = existeStorage(idMeal)
      ? "Eliminar de favoritos"
      : "Agregar a favoritos";
    // Pasamos un objeto con los datos de la receta
    btnFavorito.onclick = function () {
      if (existeStorage(idMeal)) {
        eliminarFavorito(idMeal);
        btnFavorito.textContent = "Agregar a favoritos";
        mostrarToast("Receta eliminada de favoritos");
        return;
      }

      agregarfavorito({
        id: idMeal,
        titulo: strMeal,
        img: strMealThumb,
      });

      btnFavorito.textContent = "Eliminar de favoritos";
      mostrarToast("Receta agregada a favoritos");
    };

    const btnCerrarModal = document.createElement("BUTTON");
    btnCerrarModal.classList.add("btn", "btn-secondary", "col");
    btnCerrarModal.textContent = "Cerrar";
    btnCerrarModal.onclick = function () {
      modal.hide();
    };

    modalFooter.appendChild(btnFavorito);
    modalFooter.appendChild(btnCerrarModal);

    // Mostrar la ventana modal
    modal.show();
  }

  function agregarfavorito(receta) {
    // JSON.parse convierte un string a un objeto
    const favoritos = JSON.parse(localStorage.getItem("favoritos") ?? "[]");
    localStorage.setItem("favoritos", JSON.stringify([...favoritos, receta]));
  }

  function eliminarFavorito(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos") ?? "[]");

    // Filtramos el arreglo de favoritos y regresamos todos los elementos que no tengan el id que queremos eliminar
    const nuevosFavoritos = favoritos.filter((favorito) => favorito.id !== id); // Si el id es igual al id que queremos eliminar, regresa false y no lo agrega al nuevo arreglo

    localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos));
  }

  function existeStorage(id) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos") ?? "[]");

    // Regresa true si el id existe en al menos un elemento del arreglo de favoritos
    return favoritos.some((favorito) => favorito.id === id);
  }

  function mostrarToast(mensaje) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");

    // Le pasamos el elemento donde queremos generar el toast
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = mensaje;

    toast.show();
  }

  function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos") ?? "[]");

    if (favoritos.length) {
      mostrarRecetas(favoritos);
      return;
    }

    const noFavoritos = document.createElement("P");
    noFavoritos.classList.add("fs-4", "text-center", "font-bold", "mt-5");
    noFavoritos.textContent = "No hay favoritos";
    favoritosDiv.appendChild(noFavoritos);
  }

  function limpiarHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
