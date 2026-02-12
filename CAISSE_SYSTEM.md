# Système de Caisse Multi-Postes - Documentation

## 🎯 Vue d'ensemble

Le système de caisse a été étendu pour supporter un flux de travail multi-postes avec deux nouveaux rôles :
- **Auxiliaire** : Créer et envoyer des commandes à la caisse
- **Caisse (Caissier)** : Recevoir et encaisser les commandes

## 👤 Nouveaux Rôles

### 1. Auxiliaire
**Identifiants de test:**
- Username: `aux1` / Password: `aux123` (Poste 1)
- Username: `aux2` / Password: `aux123` (Poste 2)

**Permissions:**
- ✅ Créer des commandes
- ✅ Ajouter des produits au panier
- ✅ Envoyer des commandes à la caisse
- ✅ Voir l'historique de ses propres commandes
- ✅ Voir le statut en temps réel de ses commandes
- ❌ Encaisser des commandes
- ❌ Modifier les commandes envoyées

**Interface spécifique:**
- Recherche de médicaments
- Panier de commande
- Bouton "Envoyer à la caisse"
- Liste des commandes personnelles avec statuts

### 2. Caisse (Caissier)
**Identifiants de test:**
- Username: `caisse` / Password: `caisse123`

**Permissions:**
- ✅ Voir toutes les commandes en attente
- ✅ Encaisser les commandes
- ✅ Choisir le mode de paiement
- ✅ Imprimer les tickets de caisse
- ✅ Voir l'historique des paiements
- ❌ Créer des commandes
- ❌ Modifier les commandes payées

**Interface spécifique:**
- Vue centralisée des commandes en attente
- Statistiques en temps réel (commandes, recettes)
- Interface d'encaissement
- Génération et impression de tickets

## 📋 Modèles de Données

### Order (Commande)
```typescript
interface Order {
  id: string;
  orderNumber: string;           // Ex: CMD000001
  auxiliaryId: string;
  auxiliaryName: string;
  workstation: string;            // Poste d'origine
  items: OrderItem[];
  total: number;
  status: 'En attente' | 'Payée' | 'Annulée';
  paymentMethod?: 'Espèces' | 'Mobile Money' | 'Autre';
  createdAt: string;
  paidAt?: string;
  cashierId?: string;
  cashierName?: string;
}
```

### AuditLog (Journal d'actions)
```typescript
interface AuditLog {
  id: string;
  action: 'Création commande' | 'Envoi à caisse' | 'Encaissement' | 'Annulation';
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details?: string;
}
```

## 🔄 Flux de Commande

### Étape 1: Création (Auxiliaire)
1. L'auxiliaire se connecte à son poste
2. Recherche et sélectionne des médicaments
3. Ajoute les produits au panier
4. Vérifie le total
5. Clique sur "Envoyer à la caisse"

**Résultat:**
- Commande créée avec statut "En attente"
- Numéro de commande généré automatiquement
- Enregistrement dans le journal d'audit

### Étape 2: Réception (Caisse)
1. La commande apparaît instantanément sur l'écran caisse
2. Le caissier voit toutes les informations :
   - Numéro de commande
   - Nom de l'auxiliaire
   - Poste d'origine
   - Liste des produits
   - Total à payer
   - Date/heure de création

### Étape 3: Encaissement (Caisse)
1. Le caissier clique sur "Encaisser"
2. Vérifie les détails de la commande
3. Sélectionne le mode de paiement :
   - Espèces
   - Mobile Money
   - Autre
4. Valide le paiement

**Résultat:**
- Statut change à "Payée"
- Ticket de caisse généré
- Commande verrouillée (lecture seule)
- Mise à jour visible en temps réel par l'auxiliaire

### Étape 4: Impression du Ticket
Le ticket généré contient :
```
HealthCare Pharmacy
123 Medical Plaza, City Center
+1 234 567 8900

N° Ticket: CMD000001
Date: 21/01/2026
Heure: 14:30:25

Paracetamol 500mg
  2 × $2.50                  $5.00

Ibuprofen 400mg
  1 × $3.50                  $3.50

TOTAL                        $8.50

Mode de paiement: Espèces
Caissier: Marie Dupont
Auxiliaire: Pierre Martin
Poste: Poste 1

Merci de votre visite
À bientôt !
```

## 🖥️ Système Multi-Machines

### Identification des Postes
Chaque auxiliaire est assigné à un poste spécifique :
- **Poste 1** : aux1 (Pierre Martin)
- **Poste 2** : aux2 (Sophie Bernard)
- **Caisse** : caisse (Marie Dupont)

### Synchronisation en Temps Réel
**Mécanisme actuel:**
- Rafraîchissement automatique toutes les 2 secondes
- Les commandes apparaissent instantanément à la caisse
- Les changements de statut sont visibles par tous

**Pour production:**
- WebSocket pour sync en temps réel
- Server-Sent Events (SSE)
- Polling intelligent avec backoff

### Gestion des Conflits
**Protection intégrée:**
- ✅ Une commande ne peut être payée qu'une seule fois
- ✅ Les commandes payées ne peuvent être modifiées
- ✅ Erreur si tentative de double encaissement
- ✅ Verrouillage automatique après paiement

## 🔐 Sécurité & Contrôle

### Restrictions par Rôle

**Auxiliaire:**
- Peut créer des commandes
- Ne peut voir que SES commandes
- Ne peut modifier une commande après envoi
- Ne peut encaisser aucune commande

**Caisse:**
- Peut voir TOUTES les commandes
- Peut encaisser uniquement les commandes "En attente"
- Ne peut modifier les commandes payées
- Ne peut créer de commandes

**Admin:**
- Accès complet au système
- Peut annuler des commandes
- Peut voir tous les journaux d'audit

### Journal d'Audit
Toutes les actions critiques sont enregistrées :

```typescript
[2026-01-21 14:25:00] Création commande
  - Commande: CMD000001
  - Utilisateur: Pierre Martin (Auxiliaire)
  - Détails: 2 article(s), Total: $8.50

[2026-01-21 14:30:25] Encaissement
  - Commande: CMD000001
  - Utilisateur: Marie Dupont (Caisse)
  - Détails: Mode: Espèces, Montant: $8.50
```

### Validation des Données
- ✅ Vérification de stock avant création de commande
- ✅ Validation des quantités
- ✅ Contrôle des doublons (numéro de commande unique)
- ✅ Vérification du statut avant toute action

## 📊 Statistiques Caisse

L'interface caisse affiche en temps réel :

1. **Commandes en attente**
   - Nombre de commandes à traiter
   - Alerte visuelle (orange)

2. **Commandes aujourd'hui**
   - Total des commandes du jour
   - Tous statuts confondus

3. **Recettes aujourd'hui**
   - Somme des commandes payées
   - Calculé en temps réel

## 🎨 Design & UX

### Interface Auxiliaire
- **Couleur principale:** Vert (rôle auxiliaire)
- **Layout:** 2/3 sélection produits, 1/3 panier
- **Navigation:** Simplifiée (un seul écran)
- **Feedback:** Toast notifications pour chaque action

### Interface Caisse
- **Couleur principale:** Orange (commandes en attente)
- **Layout:** Grille de commandes en attente + historique
- **Cartes:** Grand format pour faciliter la lecture
- **Actions:** Boutons proéminents pour encaisser

### Codes Couleur des Statuts
- 🟠 **En attente** : Orange (action requise)
- 🟢 **Payée** : Vert (complété)
- 🔴 **Annulée** : Rouge (annulé)

## 🚀 Utilisation

### Scénario Complet

**1. Connexion Auxiliaire**
```
Login: aux1 / aux123
→ Interface Poste Auxiliaire (Poste 1)
```

**2. Création Commande**
```
Recherche: "Paracetamol"
→ Sélectionne Paracetamol 500mg
→ Quantité: 2
→ Ajouter au panier

Recherche: "Ibuprofen"
→ Sélectionne Ibuprofen 400mg
→ Quantité: 1
→ Ajouter au panier

Total: $8.50
→ "Envoyer à la caisse"
✅ Commande CMD000001 envoyée
```

**3. Connexion Caisse (dans un autre navigateur/onglet)**
```
Login: caisse / caisse123
→ Interface Caisse
→ Voit CMD000001 en "En attente"
```

**4. Encaissement**
```
Clique sur CMD000001
→ Dialog d'encaissement s'ouvre
→ Vérifie les détails
→ Sélectionne "Espèces"
→ "Valider le paiement"
✅ Ticket de caisse généré
✅ Statut → "Payée"
```

**5. Vérification Auxiliaire**
```
Retour sur aux1
→ CMD000001 apparaît comme "Payée" ✅
```

## 📱 Fonctionnalités Avancées

### Impression du Ticket
```javascript
// Bouton "Imprimer"
→ Ouvre dialog d'impression du navigateur
→ Format optimisé pour imprimante thermique
→ Contenu: Voir modèle de ticket ci-dessus
```

### Recherche de Commandes
- Filtrer par statut
- Rechercher par numéro
- Filtrer par auxiliaire
- Filtrer par date

### Statistiques
- Recettes par période
- Performance par auxiliaire
- Modes de paiement populaires
- Tendances horaires

## 🔧 Architecture Technique

### Services
```
orderService      → Gestion CRUD des commandes
auditService      → Journal d'audit
```

### Controllers
```
orderController   → Business logic commandes
                  → Gestion temps réel (polling)
```

### Views
```
AuxiliaireView    → Interface poste auxiliaire
CaisseView        → Interface caisse/encaissement
```

## 📝 TODO pour Production

### Court Terme
- [ ] WebSocket pour sync temps réel
- [ ] Impression automatique du ticket
- [ ] Sons de notification
- [ ] Historique de recherche

### Moyen Terme
- [ ] Statistiques avancées
- [ ] Export de données
- [ ] Gestion des retours
- [ ] Remboursements

### Long Terme
- [ ] App mobile caisse
- [ ] Intégration TPE
- [ ] Multi-pharmacie
- [ ] BI / Reporting

## 🎯 Avantages du Système

### Pour l'Auxiliaire
- ✅ Interface simplifiée et rapide
- ✅ Focus sur la sélection de produits
- ✅ Pas de gestion de paiement
- ✅ Feedback visuel immédiat

### Pour le Caissier
- ✅ Vue centralisée
- ✅ Gestion efficace des files
- ✅ Moins d'erreurs de caisse
- ✅ Traçabilité complète

### Pour l'Admin
- ✅ Audit complet
- ✅ Statistiques détaillées
- ✅ Contrôle des opérations
- ✅ Séparation des responsabilités

## 📞 Support

**Identifiants de test:**
- Admin: `admin` / `admin123`
- Caisse: `caisse` / `caisse123`
- Auxiliaire 1: `aux1` / `aux123`
- Auxiliaire 2: `aux2` / `aux123`

**Flux recommandé pour tester:**
1. Ouvrir 2 navigateurs/onglets
2. Connexion aux1 sur le premier
3. Connexion caisse sur le second
4. Créer une commande avec aux1
5. Encaisser avec caisse
6. Observer la mise à jour en temps réel

---

**Version:** 2.0.0
**Date:** 21 Janvier 2026
**Statut:** ✅ Opérationnel
