# PRD — Plataforma Colaborativa de Alimentação para Animais de Rua

## 1. Visão do Produto

Criar uma **plataforma mobile colaborativa** que permita à comunidade **mapear, monitorar e manter pontos de alimentação para animais de rua**.

O sistema utilizará **geolocalização, atualização comunitária e validação por imagem** para garantir que recipientes de água e ração espalhados pela cidade permaneçam abastecidos.

### Objetivos principais

- Coordenar voluntários
- Aumentar a confiabilidade dos pontos de alimentação
- Facilitar a descoberta de recipientes próximos
- Criar um sistema escalável para qualquer cidade
- Possibilitar monetização futura com patrocinadores locais

---

# 2. Problema

Animais de rua frequentemente dependem de recipientes de água ou comida mantidos por voluntários.

Atualmente existem alguns problemas:

- Falta de visibilidade dos pontos existentes
- Dificuldade em saber se o recipiente está vazio
- Falta de coordenação entre voluntários
- Informações desatualizadas
- Ausência de incentivo para colaboração

---

# 3. Objetivos do Produto

## Objetivos Primários

- Mapear pontos de alimentação em um mapa público
- Permitir atualização comunitária do status do recipiente
- Exibir histórico de abastecimento
- Permitir navegação até o ponto
- Validar atualizações via foto

## Objetivos Secundários

- Criar reputação para voluntários
- Identificar pontos com maior necessidade
- Criar um sistema confiável de dados
- Possibilitar monetização futura

---

# 4. Personas

## Voluntário

Pessoa que ajuda a manter recipientes abastecidos.

**Objetivos**

- Encontrar pontos vazios próximos
- Navegar até o local
- Registrar abastecimento

---

## Observador

Pessoa que apenas acompanha o mapa.

**Objetivos**

- Ver pontos próximos
- Saber onde existem recipientes

---

## Administrador

Responsável por monitorar qualidade das informações.

**Objetivos**

- Remover pontos inválidos
- Identificar spam
- Moderar conteúdo

---

# 5. Funcionalidades (Core Features)

---

# 5.1 Mapa de Pontos de Alimentação

Tela inicial do aplicativo.

Exibe um **mapa interativo com pontos de alimentação**.

### Funcionalidades

- Visualização de marcadores no mapa
- Clusterização de marcadores em áreas densas
- Atualização em tempo real
- Filtro por proximidade

### Estados do recipiente

| Status | Cor | Significado |
|------|------|------|
| Cheio | Verde | Recipiente abastecido |
| Vazio | Vermelho | Necessita abastecimento |
| Desconhecido | Amarelo | Status não confirmado |
| Desatualizado | Cinza | Não atualizado há muito tempo |

### Informações exibidas

- Status
- Distância até o usuário
- Última atualização

---

# 5.2 Detalhes do Ponto (Bottom Sheet)

Ao tocar em um marcador, abre um **painel deslizante** com informações completas.

### Informações exibidas

- Nome ou identificação do ponto
- Foto mais recente
- Status atual
- Última atualização
- Histórico de abastecimentos
- Quantidade de voluntários que já ajudaram

### Componentes

- Carrossel de fotos
- Botões de ação
- Histórico de atividades

---

# 5.3 Carrossel de Fotos

Cada ponto possui fotos enviadas pela comunidade.

### Objetivos

- Mostrar estado do recipiente
- Validar atualizações

Cada foto possui:

- Data
- Usuário
- Status registrado no momento

---

# 5.4 Ações do Voluntário

## Botão "Abasteci aqui"

Permite registrar que o ponto foi abastecido.

### Fluxo

1. Usuário toca em **Abasteci aqui**
2. Abre câmera
3. Usuário tira foto do recipiente
4. Foto é enviada ao backend
5. Backend valida imagem
6. Status do ponto é atualizado

### Resultado

- Marcador muda para verde
- Atualização é enviada em tempo real para todos os usuários

---

## Botão "Recipiente vazio"

Permite marcar que o recipiente está vazio.

### Fluxo

- Usuário marca o status
- Opcionalmente envia foto

---

## Botão "Como chegar"

Abre o aplicativo de mapas do celular.

Suporte para:

- Google Maps
- Apple Maps

Utiliza **Deep Linking**.

---

# 5.5 Sistema de Reputação

Voluntários acumulam pontos por colaboração.

### Pontuação

| Ação | Pontos |
|-----|-----|
| Abastecimento confirmado | +10 |
| Atualização de status | +2 |

### Possíveis níveis

- Iniciante
- Colaborador
- Guardião dos Animais
- Herói da Comunidade

---

# 6. Funcionalidades Futuras

## Notificações de proximidade

Notificar usuários quando:

- Um ponto estiver vazio
- Um ponto não for atualizado há muito tempo

---

## Sistema de Gamificação

- Badges
- Ranking semanal
- Conquistas

---

## Sistema de denúncias

Usuários podem denunciar:

- Ponto inexistente
- Spam
- Foto falsa

---

# 7. Monetização (Fase 2)

---

## Pins patrocinados

Empresas locais podem aparecer no mapa.

Exemplos:

- Pet shops
- Clínicas veterinárias
- ONGs

### Diferenças visuais

- Logo da empresa
- Destaque no mapa
- Prioridade visual (zIndex maior)

---

## Ofertas e cupons

Dentro do detalhe do ponto podem aparecer:

- Promoções
- Descontos

Baseado na **localização do usuário**.

---

# 8. Arquitetura Técnica

---

# 8.1 Frontend

Framework:

React Native

Bibliotecas principais:

- react-native-maps
- react-native-reanimated
- @gorhom/bottom-sheet
- expo-location ou react-native-geolocation

### Responsabilidades

- Renderizar mapa
- Renderizar marcadores
- Abrir detalhes
- Enviar fotos
- Atualizar status
- Navegar até ponto

---

# 8.2 Backend

Infraestrutura:

Supabase

Componentes utilizados:

- PostgreSQL
- PostGIS
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions

---

# 8.3 Banco de Dados

## users

| Campo | Tipo |
|------|------|
| id | uuid |
| name | text |
| email | text |
| reputation_points | integer |
| created_at | timestamp |

---

## feeding_points

| Campo | Tipo |
|------|------|
| id | uuid |
| latitude | numeric |
| longitude | numeric |
| description | text |
| status | text |
| created_at | timestamp |
| created_by | uuid |

### Status possíveis

- full
- empty
- unknown

---

## feeding_updates

Registro de atualizações.

| Campo | Tipo |
|------|------|
| id | uuid |
| feeding_point_id | uuid |
| user_id | uuid |
| status | text |
| photo_url | text |
| created_at | timestamp |

---

## feeding_photos

| Campo | Tipo |
|------|------|
| id | uuid |
| feeding_point_id | uuid |
| photo_url | text |
| uploaded_by | uuid |
| created_at | timestamp |

---

# 8.4 Storage

Supabase Storage

Bucket:


feeding-point-photos


---

# 8.5 Realtime

Supabase Realtime será usado para:

- Atualizar marcadores no mapa
- Sincronizar status
- Atualizar histórico

### Fluxo


usuário envia atualização
↓
banco atualiza
↓
realtime dispara evento
↓
apps conectados recebem atualização


---

# 8.6 Validação por IA

Edge Functions processam as fotos enviadas.

### Processo

1. Foto enviada
2. Edge Function recebe
3. Envia imagem para modelo de visão
4. Modelo verifica se recipiente está cheio
5. Se aprovado → atualiza status
6. Se reprovado → marca como suspeito

---

# 9. Performance

Para evitar lentidão com muitos pontos:

- Clusterização de marcadores
- `tracksViewChanges={false}`
- Carregamento por **bounding box**
- Cache local

---

# 10. Segurança

- Autenticação Supabase
- Rate limit para updates
- Validação de imagem
- Detecção de spam

---

# 11. Escalabilidade

Arquitetura preparada para:

- Múltiplas cidades
- Milhões de pontos
- Milhares de usuários simultâneos

O uso de **PostGIS** permite consultas geográficas eficientes.

---

# 12. Métricas de Sucesso

- Número de pontos cadastrados
- Número de abastecimentos realizados
- Usuários ativos mensais
- Tempo médio entre abastecimentos

---

# 13. Roadmap

## MVP

- Mapa
- Cadastro de pontos
- Atualização de status
- Upload de fotos
- Navegação até ponto
- Realtime

---

## Fase 2

- Sistema de reputação
- Notificações
- Moderação

---

## Fase 3

- Monetização
- Pins patrocinados
- Cupons e ofertas