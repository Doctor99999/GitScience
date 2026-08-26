/*
 * ============================================================================
 * GitScience™ Genesis Protocol Consensus Specification
 * Module: genesis_protocol.c
 * * FUNDAMENTAL PROTOCOL INVARIANTS (FAIR-SHARE CONSENSUS / AMANAT RULE):
 * - Author Research Share (Врачу / Ученому) : 55.00% (5500 bps)
 * - Infrastructure & DeSci Fund (Ноды, P2P) : 15.00% (1500 bps)
 * - Genesis Founder Wallet (Создателю сети)  : 30.00% (3000 bps)
 * ============================================================================
 */

#include <stdio.h>
#include <stdint.h>

#define GITSCIENCE_PROTOCOL_VERSION "1.0.0-GENESIS"

/* Базисные пункты: 10000 = 100.00% (защита от ошибок округления чисел с плавающей точкой) */
static const uint32_t BASIS_POINTS_TOTAL   = 10000;
static const uint32_t BASIS_POINTS_AUTHOR  = 5500;  /* 55.00% */
static const uint32_t BASIS_POINTS_INFRA   = 1500;  /* 15.00% */
static const uint32_t BASIS_POINTS_FOUNDER = 3000;  /* 30.00% */

typedef struct {
    double total_amount;
    double author_share;
    double infra_fund;
    double founder_share;
} SplitResult;

/* Атомарный расчет долей Fair-Share */
SplitResult calculate_fair_share(double amount) {
    SplitResult result;
    result.total_amount  = amount;
    result.author_share  = (amount * BASIS_POINTS_AUTHOR) / (double)BASIS_POINTS_TOTAL;
    result.infra_fund    = (amount * BASIS_POINTS_INFRA) / (double)BASIS_POINTS_TOTAL;
    result.founder_share = (amount * BASIS_POINTS_FOUNDER) / (double)BASIS_POINTS_TOTAL;
    return result;
}

int main(void) {
    printf("=== GitScience Protocol Consensus Initialized ===\n");
    printf("Version: %s\n", GITSCIENCE_PROTOCOL_VERSION);
    printf("Author: 55%% | Infra: 15%% | Founder: 30%%\n");
    return 0;
}