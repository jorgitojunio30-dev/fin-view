# Sistema de Gestão Financeira Familiar
**Documento de Especificação — v1.0**
*Maio de 2026*

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Módulo de Usuários e Autenticação](#3-módulo-de-usuários-e-autenticação)
4. [Módulo de Contas Bancárias](#4-módulo-de-contas-bancárias)
5. [Módulo de Cartões de Crédito](#5-módulo-de-cartões-de-crédito)
6. [Módulo de Receitas](#6-módulo-de-receitas)
7. [Módulo de Despesas](#7-módulo-de-despesas)
8. [Módulo de Projeção Financeira](#8-módulo-de-projeção-financeira)
9. [Módulo de Relatórios e Gráficos](#9-módulo-de-relatórios-e-gráficos)
10. [Módulo de Alertas](#10-módulo-de-alertas)
11. [Estrutura do Banco de Dados (Firebase)](#11-estrutura-do-banco-de-dados-firebase)
12. [Mapa de Telas](#12-mapa-de-telas)
13. [Ordem de Desenvolvimento Sugerida](#13-ordem-de-desenvolvimento-sugerida)

---

## 1. Visão Geral do Projeto

O sistema tem como objetivo oferecer uma plataforma web responsiva para gestão financeira pessoal e familiar. Cada usuário possui sua própria conta individual com dados completamente isolados. Caso o casal queira uma visão financeira conjunta, basta criar um terceiro usuário compartilhado.

### Objetivos Principais

- Registrar receitas e despesas mensais
- Gerenciar múltiplas contas bancárias
- Controlar cartões de crédito com parcelamento automático
- Separar despesas fixas de variáveis
- Projetar o próximo mês automaticamente
- Visualizar gráficos e relatórios de gastos
- Emitir alertas inteligentes

### Princípios do Sistema

- **Simplicidade:** interface intuitiva e sem burocracia
- **Autonomia:** cada usuário gerencia suas próprias finanças
- **Flexibilidade:** conta compartilhada via login único quando necessário
- **Responsividade:** funciona bem em celular e desktop

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| Backend | Python | API REST (FastAPI ou Flask) |
| Banco de Dados | Firebase Firestore | NoSQL, dados isolados por usuário |
| Autenticação | Firebase Auth | Login, cadastro e recuperação de senha |
| Frontend | React | Web App Responsivo |
| Deploy | Render.com | Projeto já publicado |
| Plataforma | Web App Responsivo | Mobile-friendly, sem necessidade de app nativo |

> **Nota:** O projeto já possui infraestrutura configurada no Render.com com Python, Firebase e React, o que elimina a necessidade de configurar ambiente do zero.

---

## 3. Módulo de Usuários e Autenticação

### Cadastro

Campos necessários para criação de conta:
- Nome
- E-mail
- Senha
- Confirmação de senha

### Login

- E-mail + Senha
- Opção "Esqueci minha senha" com envio de e-mail de recuperação

### Fluxo de Autenticação

1. Usuário acessa o sistema
2. Clica em "Criar conta" ou "Entrar"
3. Preenche os campos necessários
4. Entra direto no sistema já autenticado

> **Nota:** O Firebase Auth resolve cadastro, login, recuperação de senha e gerenciamento de sessão nativamente, sem necessidade de implementação manual.

### Isolamento de Dados

Todos os dados do sistema são vinculados ao `userId` do Firebase Auth. Cada usuário vê e gerencia exclusivamente seus próprios dados. Não há compartilhamento automático entre usuários.

---

## 4. Módulo de Contas Bancárias

### Cadastro de Conta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | texto | Ex: Conta Nubank, Conta Bradesco |
| Banco | texto | Nome do banco |
| Tipo | seleção | Corrente ou Poupança |

### Funcionalidades

- Listar todas as contas cadastradas
- Adicionar nova conta
- Editar conta existente
- Excluir conta
- Vincular receitas e despesas a uma conta específica

> **Nota:** O saldo da conta é calculado com base nos lançamentos realizados (receitas - despesas), sem necessidade de informar saldo manualmente.

---

## 5. Módulo de Cartões de Crédito

### Cadastro do Cartão

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | texto | Ex: Nubank, Inter, Bradesco |
| 4 últimos dígitos | número | Identificação do cartão |
| Limite | número | Limite total do cartão |
| Dia de fechamento | número | Dia do mês em que a fatura fecha |
| Dia de vencimento | número | Dia do mês em que a fatura vence |

### Lançamento de Compras

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Cartão | seleção | Qual cartão foi utilizado |
| Descrição | texto | O que foi comprado |
| Categoria | seleção | Categoria da compra |
| Valor total | número | Valor total da compra |
| Parcelas | número | Quantidade de parcelas (1x a 36x) |
| Data da compra | data | Data em que a compra foi realizada |

### Lógica de Parcelamento

Ao cadastrar uma compra parcelada, o sistema distribui automaticamente as parcelas nos meses seguintes. Cada parcela gera um documento separado no banco de dados, permitindo que a fatura de cada mês seja montada automaticamente.

> **Exemplo:** Compra de R$ 1.200,00 em 6x em maio gera R$ 200,00 automaticamente nas faturas de maio, junho, julho, agosto, setembro e outubro.

### Lógica de Fatura

- O sistema identifica a qual fatura pertence cada compra com base no dia de fechamento do cartão
- Compra **antes** do fechamento → entra na fatura do mês atual
- Compra **após** o fechamento → entra na fatura do próximo mês
- A fatura é montada automaticamente somando todas as parcelas daquele mês

### Status da Fatura

| Status | Descrição |
|--------|-----------|
| Aberta | Ainda recebendo lançamentos do ciclo atual |
| Fechada | Passou o dia de fechamento, valor definido |
| Paga | Fatura quitada pelo usuário |

### Fluxo de Fechamento

1. Sistema monitora o dia de fechamento cadastrado
2. Quando a data chega, dispara alerta: *"Sua fatura do [Cartão] fecha hoje, deseja confirmar o fechamento?"*
3. Usuário revisa as compras e confirma manualmente
4. Fatura fica bloqueada para novos lançamentos naquele ciclo
5. No vencimento, novo alerta: *"Fatura do [Cartão] vence amanhã — R$ X.XXX,XX"*
6. Usuário marca como paga e informa qual conta bancária foi debitada

> **Importante:** O usuário tem controle total. O sistema sugere o fechamento com base na data cadastrada, mas só efetiva quando o usuário confirmar. Isso evita problemas com feriados e ajustes bancários.

---

## 6. Módulo de Receitas

### Lançamento de Receita

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Descrição | texto | Ex: Salário, Freelance |
| Valor | número | Valor recebido |
| Categoria | seleção | Categoria da receita |
| Conta bancária | seleção | Conta onde foi depositado |
| Data | data | Data do recebimento |

### Categorias de Receita (padrão)

- Salário
- Freelance
- Investimentos
- Bônus
- Outros

As categorias são personalizáveis: o usuário pode criar, editar e excluir categorias próprias.

---

## 7. Módulo de Despesas

### Tipos de Despesa

| Tipo | Descrição | Comportamento |
|------|-----------|---------------|
| Fixa | Valor constante todo mês | Cadastrada uma vez e replicada automaticamente nos meses seguintes |
| Variável | Valor diferente a cada mês | Lançada manualmente a cada ocorrência |

### Lançamento de Despesa

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Descrição | texto | Ex: Aluguel, Mercado |
| Valor | número | Valor da despesa |
| Categoria | seleção | Categoria da despesa |
| Tipo | seleção | Fixa ou Variável |
| Conta bancária | seleção | Conta de onde saiu o dinheiro |
| Data | data | Data do pagamento |

### Despesas Fixas

Ao cadastrar uma despesa como fixa, o sistema replica automaticamente o lançamento para os meses futuros. Todas as ocorrências compartilham um mesmo `recurringId`, o que permite:

- Editar uma ocorrência específica sem alterar as demais
- Editar todas as ocorrências futuras de uma vez
- Excluir uma ou todas as ocorrências futuras

### Categorias de Despesa (padrão)

- Moradia (aluguel, condomínio, IPTU)
- Alimentação (mercado, restaurantes)
- Transporte (combustível, Uber, transporte público)
- Saúde (plano de saúde, remédios, consultas)
- Educação (cursos, mensalidade escolar)
- Lazer (viagens, entretenimento)
- Assinaturas (streaming, software)
- Outros

---

## 8. Módulo de Projeção Financeira

A projeção é uma visão antecipada do próximo mês, gerada automaticamente pelo sistema com base nos dados já cadastrados.

### O que é incluído automaticamente na projeção

- Todas as despesas fixas cadastradas
- Parcelas futuras dos cartões de crédito
- Receitas esperadas (baseadas na média dos últimos meses)

### Cálculos da Projeção

| Indicador | Como é calculado |
|-----------|-----------------|
| Receita esperada | Média das receitas dos últimos 3 meses |
| Despesas fixas | Soma de todas as despesas fixas ativas |
| Parcelas de cartão | Soma das parcelas que vencem no próximo mês |
| Saldo projetado | Receita esperada - Despesas fixas - Parcelas |
| Limite para variáveis | Saldo projetado disponível para gastos variáveis |

> **Exemplo:** Receita esperada R$ 8.000 | Despesas fixas R$ 3.200 | Parcelas R$ 900 | **Saldo projetado R$ 3.900** disponível para gastos variáveis no mês.

---

## 9. Módulo de Relatórios e Gráficos

### Gráficos Disponíveis

| Gráfico | Tipo | Descrição |
|---------|------|-----------|
| Gastos por categoria | Pizza | Percentual de cada categoria no total de despesas do mês |
| Receitas vs Despesas | Barras | Evolução mensal comparando entradas e saídas |
| Crescimento da fatura | Linha | Como a fatura do cartão cresceu durante o mês |
| Maiores gastos | Barras | Top categorias de maior gasto do mês |
| Comparativo mensal | Barras | Mês atual vs mês anterior |

### Filtros Disponíveis

- Por mês e ano
- Por categoria
- Por conta bancária
- Por cartão de crédito
- Por período personalizado

---

## 10. Módulo de Alertas

| Alerta | Quando dispara | Mensagem |
|--------|---------------|----------|
| Fechamento de fatura | No dia de fechamento do cartão | "Sua fatura do [Cartão] fecha hoje. Deseja confirmar?" |
| Vencimento de fatura | 1 dia antes do vencimento | "Fatura do [Cartão] vence amanhã — R$ X.XXX,XX" |
| Limite do cartão | Ao atingir 80% do limite | "[Cartão] atingiu 80% do limite. Gasto atual: R$ X.XXX" |
| Orçamento estourado | Ao ultrapassar o limite projetado | "Você ultrapassou o limite de gastos variáveis deste mês" |
| Próximo ao limite | Ao atingir 90% do orçamento | "Você está próximo do limite de gastos deste mês" |

---

## 11. Estrutura do Banco de Dados (Firebase)

### users — Usuários

```
users/
  {userId}/
    name:        string
    email:       string
    createdAt:   timestamp
```

### accounts — Contas Bancárias

```
users/{userId}/accounts/
  {accountId}/
    name:        string
    bank:        string
    type:        string  (corrente | poupanca)
    createdAt:   timestamp
```

### cards — Cartões de Crédito

```
users/{userId}/cards/
  {cardId}/
    name:          string
    lastDigits:    string
    limit:         number
    closingDay:    number
    dueDay:        number
    createdAt:     timestamp
```

### cardPurchases — Compras no Cartão

```
users/{userId}/cardPurchases/
  {purchaseId}/
    cardId:              string
    description:         string
    category:            string
    totalAmount:         number   // valor total da compra
    installments:        number   // total de parcelas
    currentInstallment:  number   // número desta parcela
    amount:              number   // valor desta parcela
    date:                timestamp
    month:               string   // YYYY-MM (mês desta parcela)

// Cada parcela = 1 documento separado
// A fatura é montada filtrando por cardId + month
```

### invoices — Faturas

```
users/{userId}/invoices/
  {invoiceId}/
    cardId:       string
    month:        string   // YYYY-MM
    status:       string   // aberta | fechada | paga
    totalAmount:  number
    dueDate:      timestamp
    paidAt:       timestamp
    accountId:    string   // conta usada no pagamento
```

### revenues — Receitas

```
users/{userId}/revenues/
  {revenueId}/
    description:  string
    amount:       number
    category:     string
    accountId:    string
    date:         timestamp
    month:        string   // YYYY-MM
```

### expenses — Despesas

```
users/{userId}/expenses/
  {expenseId}/
    description:  string
    amount:       number
    category:     string
    accountId:    string
    type:         string   // fixa | variavel
    date:         timestamp
    month:        string   // YYYY-MM
    isRecurring:  boolean
    recurringId:  string   // agrupa despesas fixas da mesma série
```

### categories — Categorias

```
users/{userId}/categories/
  {categoryId}/
    name:        string
    type:        string   // receita | despesa
    color:       string   // hex para uso nos gráficos
    createdAt:   timestamp
```

### alerts — Alertas

```
users/{userId}/alerts/
  {alertId}/
    type:        string   // limite_cartao | orcamento | vencimento | fechamento
    message:     string
    read:        boolean
    createdAt:   timestamp
```

---

## 12. Mapa de Telas

| Tela | Descrição | Conteúdo Principal |
|------|-----------|-------------------|
| Login | Acesso ao sistema | E-mail, senha, link para cadastro e recuperação |
| Cadastro | Criação de conta | Nome, e-mail, senha, confirmação |
| Recuperar Senha | Reset de senha | E-mail para receber link de reset |
| Dashboard | Tela inicial | Saldo do mês, receitas, despesas, gráficos, alertas |
| Receitas | Gestão de entradas | Lista por mês, adicionar, editar, excluir |
| Despesas | Gestão de saídas | Lista por mês (fixas e variáveis), CRUD |
| Cartões | Gestão de cartões | Lista de cartões, fatura atual, compras |
| Detalhe do Cartão | Visão de um cartão | Compras do mês, histórico de faturas |
| Contas Bancárias | Gestão de contas | Lista de contas, saldos, CRUD |
| Relatórios | Gráficos e análises | Pizza, barras, evolução, comparativos |
| Projeção | Visão do próximo mês | Fixas, parcelas, receita esperada, limite variável |
| Configurações | Preferências | Perfil, senha, categorias, excluir conta |

### Navegação Mobile

Em dispositivos móveis, o menu principal será exibido como barra de navegação inferior com os 5 itens mais utilizados: Dashboard, Receitas, Despesas, Cartões e Relatórios. As demais telas (Contas, Projeção, Configurações) serão acessíveis por menu lateral ou ícone de perfil.

---

## 13. Ordem de Desenvolvimento Sugerida

Sequência recomendada para ter algo funcional o mais rápido possível, evoluindo de forma incremental:

| Fase | O que desenvolver | Resultado |
|------|-------------------|-----------|
| 1 | Autenticação (Firebase Auth) + estrutura base do projeto | Login e cadastro funcionando |
| 2 | Contas bancárias (CRUD) | Cadastro de contas |
| 3 | Receitas (CRUD + listagem por mês) | Lançamento de receitas |
| 4 | Despesas variáveis (CRUD + listagem por mês) | Lançamento de despesas |
| 5 | Despesas fixas (replicação automática) | Fixas replicadas nos meses futuros |
| 6 | Categorias personalizáveis | Gestão de categorias |
| 7 | Cartões de crédito (cadastro + compras + parcelamento) | Controle de cartões |
| 8 | Faturas (geração automática + fluxo de fechamento) | Fechamento e pagamento de faturas |
| 9 | Dashboard (visão geral do mês) | Tela principal funcional |
| 10 | Relatórios e gráficos | Visualização dos dados |
| 11 | Projeção do próximo mês | Planejamento financeiro |
| 12 | Sistema de alertas | Notificações inteligentes |
| 13 | Ajustes de UX e responsividade mobile | Produto finalizado |

> **Dica para o Claude Code:** Comece sempre pela fase 1 e garanta que a autenticação e a estrutura de segurança do Firebase estejam corretas antes de avançar. As regras do Firestore devem garantir que cada usuário só acesse seus próprios dados desde o início.

---

*Sistema de Gestão Financeira Familiar v1.0 — Maio de 2026*
