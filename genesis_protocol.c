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

/* Суммы — в целых центах (исключает float precision loss, как во всех
 * реализациях протокола: backend/gitscience_fortress.py, AmanatSplitter.sol) */
typedef struct {
    uint64_t amount_cents;
    uint64_t author_cents;
    uint64_t infra_cents;
    uint64_t founder_cents;
} SplitResult;

/* Атомарный расчет долей Fair-Share. Гарантируется: author + infra + founder == amount. */
SplitResult calculate_fair_share(uint64_t amount_cents) {
    SplitResult result;
    result.amount_cents  = amount_cents;
    result.author_cents  = (amount_cents * BASIS_POINTS_AUTHOR) / BASIS_POINTS_TOTAL;
    result.infra_cents   = (amount_cents * BASIS_POINTS_INFRA) / BASIS_POINTS_TOTAL;
    /* Последняя доля — остаток: без потерь от целочисленного деления */
    result.founder_cents = amount_cents - result.author_cents - result.infra_cents;
    return result;
}

int main(void) {
    const uint64_t amount_cents = 12345678; /* 123 456.78 USD */
    SplitResult r = calculate_fair_share(amount_cents);

    printf("=== GitScience Protocol Consensus Initialized ===\n");
    printf("Version: %s\n", GITSCIENCE_PROTOCOL_VERSION);
    printf("Author: 55%% | Infra: 15%% | Founder: 30%% (bps math, integer cents)\n");
    printf("Amount : %llu.%02llu USD\n", (unsigned long long)(r.amount_cents / 100), (unsigned long long)(r.amount_cents % 100));
    printf("Author : %llu.%02llu USD\n", (unsigned long long)(r.author_cents / 100), (unsigned long long)(r.author_cents % 100));
    printf("Infra  : %llu.%02llu USD\n", (unsigned long long)(r.infra_cents / 100), (unsigned long long)(r.infra_cents % 100));
    printf("Founder: %llu.%02llu USD\n", (unsigned long long)(r.founder_cents / 100), (unsigned long long)(r.founder_cents % 100));
    printf("Conservation: %llu.%02llu == amount\n",
        (unsigned long long)((r.author_cents + r.infra_cents + r.founder_cents) / 100),
        (unsigned long long)((r.author_cents + r.infra_cents + r.founder_cents) % 100));
    return 0;
}