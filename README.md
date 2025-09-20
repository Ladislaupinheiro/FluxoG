# Gestor Bar - Aplicação de Ponto de Venda (POS)

## Descrição

O **Gestor Bar** é uma aplicação web de ponto de venda (POS) *frontend-only*, desenhada para gerir o atendimento ao cliente, inventário de bebidas e fluxo de caixa de um pequeno bar ou estabelecimento similar. A aplicação funciona inteiramente no navegador e utiliza o `localStorage` para persistir os dados, não necessitando de um backend.

## Funcionalidades Principais

- **Dashboard:** Visão geral em tempo real das vendas do dia, contas ativas e alertas de stock.
- **Atendimento ao Cliente:** Abertura e gestão de múltiplas contas de clientes (mesas, clientes nominais), com adição e remoção de pedidos.
- **Gestão de Inventário:** Adição e edição de produtos (bebidas), com controlo de stock inicial, entradas, e stock atual.
- **Fluxo de Caixa:** Calendário para visualização de relatórios de fecho de dias anteriores.
- **Fecho do Dia:** Geração de um relatório diário detalhado, com opção de arquivamento para iniciar um novo dia de trabalho.
- **Exportação de Relatórios:** Capacidade de exportar os relatórios de fecho de dia para os formatos PDF e XLS.

## Arquitetura e Tecnologias

- **HTML5:** Estrutura semântica.
- **Tailwind CSS:** Framework de CSS para um design rápido e responsivo.
- **Font Awesome:** Biblioteca de ícones.
- **JavaScript (ES Modules):** A lógica da aplicação é modularizada para melhor organização e manutenibilidade.
  - `main.js`: Ponto de entrada da aplicação e registo dos *event listeners*.
  - `state.js`: Módulo para gestão do estado global da aplicação e persistência no `localStorage`.
  - `ui.js`: Módulo responsável por toda a manipulação do DOM e funções de renderização.
  - `handlers.js`: Módulo que contém a lógica de negócio e os manipuladores de eventos.
- **Bibliotecas Externas (via CDN):**
  - `jsPDF`: Para a geração de relatórios em PDF.
  - `XLSX (SheetJS)`: Para a geração de relatórios em Excel (XLS).

## Como Utilizar

1. Clone o repositório.
2. Abra o ficheiro `index.html` num navegador web moderno.
3. A aplicação está pronta a ser utilizada. Os dados serão guardados localmente no seu navegador.

---
*Desenvolvido como parte do projeto HAPP.*
