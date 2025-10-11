Gestor de Bar Pro
Uma Progressive Web App (PWA) para gestão de inventário e vendas de um bar, construída com Vanilla JavaScript e uma arquitetura moderna, escalável e orientada a princípios de design de software.

✨ Funcionalidades Principais
Dashboard: Uma visão geral e em tempo real do estado do negócio, incluindo vendas do dia, contas ativas e alertas de stock.

Gestão de Inventário: Controlo detalhado de produtos, com gestão de stock separada por "Armazém" e "Loja".

Atendimento ao Cliente: Gestão de contas ativas (mesas ou clientes), adição de pedidos e finalização de pagamentos.

Gestão de Clientes: Uma base de dados de clientes com histórico de consumo e gestão de dívidas.

Fluxo de Caixa: Registo de despesas e acesso ao histórico de fechos de caixa diários arquivados.

Análises (BI): Um módulo de Business Intelligence para analisar a performance de produtos e clientes ao longo de diferentes períodos.

Configurações: Personalização do negócio, gestão de temas (Claro/Escuro) e funcionalidades de Backup/Restauro de dados.

🛠️ Stack Tecnológico
Fundação: JavaScript "Vanilla" (ES Modules), HTML5 Semântico, CSS3 Moderno.

Estilização: Tailwind CSS para prototipagem rápida e consistência.

Arquitetura: Progressive Web App (PWA) com funcionamento offline via Service Worker.

Base de Dados: IndexedDB, com uma camada de abstração em Storage.js.

Bibliotecas Principais:

GSAP (GreenSock): Para todas as animações e microinterações de alta performance.

Swiper.js: Para interfaces de swipe e carrosséis táteis.

jsPDF & XLSX: Para exportação de relatórios e dados.

🏛️ Arquitetura
O projeto segue rigorosamente um conjunto de princípios para garantir qualidade, performance e manutenibilidade.

Princípios Fundamentais
State-Driven UI: A interface é sempre uma função do estado central da aplicação, gerido pelo nosso Store.js.

Separation of Concerns (SoC) & Single Responsibility Principle (SRP): Cada módulo, serviço e componente tem uma responsabilidade única e bem definida.

Arquitetura "Feature-Sliced": O código é organizado por funcionalidade de negócio (features) e não por tipo técnico, promovendo alta coesão e baixo acoplamento.

Estrutura de Diretórios
A organização dos ficheiros reflete diretamente os nossos princípios arquitetónicos:

/
|── 📁 modules/
|   |
|   |── 📁 app/                 # Orquestração principal e roteamento.
|   |── 📁 features/            # Funcionalidades de negócio isoladas (Clientes, Inventário, etc.).
|   └── 📁 shared/               # Código reutilizável por todas as features.
|       |── 📁 components/       # Componentes partilhados com lógica.
|       |── 📁 lib/             # Funções utilitárias puras.
|       |── 📁 services/         # Serviços globais (Store, Storage).
|       └── 📁 ui/               # Componentes "burros" e puros de UI.
|
|── index.html
└── ...
🚀 Como Executar o Projeto
Este projeto é uma aplicação web estática e não requer um processo de build complexo.

Clone o repositório.

Inicie um servidor web local na raiz do projeto. Uma forma simples de o fazer é com Python:

Bash

python -m http.server
Abra o seu navegador e aceda a http://localhost:8000.

