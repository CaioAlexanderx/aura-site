# F5 — Matriz feature × status (auditada no código em 10/06/2026)
Fontes: aura-backend `origin/main` b26df97 · aura-app local. Legenda: ✅ OPERA · 🟡 PARCIAL · ❌ NÃO ACHEI.

## Cunha
| # | Feature | Status | Evidência | Observação |
|---|---|---|---|---|
| 1 | Crediário/fiado c/ saldo, score, encargos CDC | ✅ | `creditInstallments.js`, `creditLedger`, `credit.js` | Score nunca bloqueia; encargos com teto CDC |
| 2 | Cobrança de crediário via WhatsApp | 🟡 | `app/(tabs)/crediario.tsx`, `crediario/settings.tsx` | **Régua com templates por etapa, mas envio é MANUAL (wa.me, 1 toque). Não é "automática"** |
| 3 | Troca/devolução no caixa | ✅ | `sales.js` (type sale/troca, breakdown, cancel troca-aware) | |
| 4 | Grade de variantes c/ estoque por SKU | ✅ | `variants.js`, `productsVariations.js`, `variantImage.js` | |

## Profundidade
| 5 | PDV + NFC-e | ✅ | `pdv.js`, `nfce.js`, `caixa.js` | Emissão automática opcional, numeração atômica |
| 6 | NF-e / NFS-e | ✅ | `nfe.js`, `nfse.js` | |
| 6b | **SAT** | ❌ | só URL de consulta SEFAZ-SC em `nfce.js` | **Sem emissão SAT — claim do site precisa sair** |
| 7 | DRE, fluxo projetado, conciliação OFX | ✅ | `dre.js`, `dreSimples.js`, `cashFlowProjection.js`, `bankReconciliation.js` | |
| 8 | Estoque: lotes/validade/balanço/XML | ✅ | `products*.js`, `danfeImport.js`, `importData.js` | |
| 9 | Folha + holerite | 🟡 | `esocial.js`, `payslipEmail.js`, `prolabore.js` | Holerite por e-mail OK; formato XML (não PDF) |

## Expansão
| 10 | Canal Digital / loja online | ✅ | `digitalChannel.js`, `digitalOrders.js`, `storefront.js`, `customDomainMiddleware` | Domínio próprio funciona (caso real: Davi Calçados) |
| 11 | HUB Social (Instagram + WhatsApp) | 🟡 | `webhookInstagram.js`, `webhookWhatsapp.js`, `whatsappRoutes.js`, `services/whatsapp.js` (WABA templates) | Automação via webhooks existe; profundidade a validar com usuário |
| 12 | Multi-CNPJ consolidado | ✅ | `authSwitchCompany.js`, `userCompanies.js`, `meAggregates.js` | |
| 13 | **Conferidor de taxas de maquininha** | ❌ | `paymentGateways.js` é só credenciais (Fase 0 MP) | **Não existe — claim do site precisa sair/suavizar** |
| 14 | API/webhooks | 🟡 | `webhookAsaas/Mp/...`, `paymentGateways.js` | Webhooks de entrada OK; "API completa" pública não evidenciada |

## Studio
| 15-17 | Configurador, aprovação de arte (link público), KDS kanban | ✅ | `studio*.js` (16 rotas), `studioApprovalPublic.js`, `studioKdsApproval.js` | |
| 18 | Mercado Livre / Shopee | 🟡 | `webhookMarketplaceStub.js` (S-3), `marketplaceAuth.js`, `studioMarketplaceListing.js` | Recebe pedidos via webhook público; integração nomeada "stub" |

## Dojô
| 19-22 | Praticantes/kyu-dan, exames, certificados, anuidades PIX | ✅ | `karate*.js` (17 rotas) | Suite completa, incl. federação e portal público |

## Outros claims do site
| 23 | Relatórios automáticos (segunda 8h BRT) | ✅ | `jobs/reportScheduler.js` | |
| 24 | Comissões por vendedor | ✅ | `commission.js`, `employeesRanking.js` | |
| 25 | Agenda online + lembretes | ✅ | `appointments.js`, `barberBooking.js` | |
| 26 | CRM LTV/retenção/aniversariantes | ✅ | `customerRanking.js`, `retention.js`, `birthday.js`, `customerReactivation.js`, `coupons.js` | |
| 27 | Importação CSV em massa | ✅ | `importData.js` | |

## Confirmações de remoção
- **Offline:** inexistente no código — claim já removido do site ✅
- **IA:** existe (`aiChat.js`, `aiInsights.js`) mas gated por plano/consent — fora do marketing ✅

## ⚠️ Conflitos copy × código (decisão do usuário)
1. **"Cobrança automática pelo WhatsApp"** (H1 da home + cards): hoje é régua + envio manual em 1 toque. Opções: (a) suavizar copy p/ "cobrança pronta no WhatsApp em 1 toque"; (b) priorizar o auto-disparo no produto (a infra WABA de templates já existe) e manter o claim.
2. **"SAT"** em produto/index: remover da lista fiscal.
3. **"Conferidor de taxas de maquininha"** (card expansão da home): remover ou trocar por multi-gateway (existe).
