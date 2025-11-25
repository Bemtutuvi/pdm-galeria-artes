import { openDB } from "idb";

let db;

async function createDB() {
  try {
    db = await openDB("banco", 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        switch (oldVersion) {
          case 0:
            const store = db.createObjectStore("obras", {
              keyPath: "nome",
            });

            store.createIndex("autor", "autor");
            store.createIndex("tipo", "tipo");
            store.createIndex("data", "data");
            showResult("Banco de dados criado!");
        }
      },
    });
    showResult("Banco de dados aberto.");
  } catch (e) {
    showResult("Erro ao criar o banco de dados: " + e.message);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await createDB();
  document.getElementById("btnSalvar").addEventListener("click", addData);
  document.getElementById("btnListar").addEventListener("click", getData);
});

async function addData() {
  const nome = document.getElementById("nome").value;
  const autor = document.getElementById("autor").value;
  const tipo = document.getElementById("tipo").value;
  const data = document.getElementById("data").value;
  const cameraOutput = document.getElementById("camera--output");
  const imagem = cameraOutput.src;

  if (!nome || !autor || !tipo || !data) {
    showResult("Preencha todos os campos antes de salvar!");
    return;
  }

  if (!imagem || imagem === "//:0") {
    showResult("Tire uma foto antes de salvar!");
    return;
  }

  const tx = await db.transaction("obras", "readwrite");
  const store = tx.objectStore("obras");
  await store.put({ nome, autor, tipo, data, imagem });
  await tx.done;
  showResult(`Obra "${nome}" salva com sucesso!`);
}

async function getData() {
  if (!db) {
    showResult("O banco de dados está fechado!");
    return;
  }

  const tx = await db.transaction("obras", "readonly");
  const store = tx.objectStore("obras");
  const values = await store.getAll();

  const listaObras = document.getElementById("listaObras");
  listaObras.innerHTML = "";

  if (values.length > 0) {
    values.forEach((obra) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${obra.nome}</strong> - ${obra.autor} (${obra.tipo}) - ${obra.data}
        <br>
        <img src="${obra.imagem}" alt="${obra.nome}" style="max-width: 200px; margin: 10px 0;">
        <br>
        <button onclick="deleteObra('${obra.nome}')">Deletar</button>
      `;
      listaObras.appendChild(li);
    });
    showResult(`${values.length} obra(s) encontrada(s)`);
  } else {
    showResult("Não há nenhuma obra no banco!");
  }
}

async function deleteData(nome) {
  if (!db) {
    showResult("O banco de dados está fechado!");
    return;
  }

  const tx = await db.transaction("obras", "readwrite");
  const store = tx.objectStore("obras");
  await store.delete(nome);
  await tx.done;
  showResult(`Obra "${nome}" deletada com sucesso!`);
  getData(); // Atualiza a lista
}

// Expor função deleteData globalmente para uso no onclick
window.deleteObra = deleteData;

function showResult(text) {
  document.querySelector("output").innerHTML = text;
}
