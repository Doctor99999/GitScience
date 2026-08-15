"""
GitScience™ Fortress: Amanat Royalty Router
Модуль справедливого распределения роялти (70/20/10 или 50/20/30) и репутации (GIS).
Сдвигает налоговое бремя на B2B покупателя (Tax Gross-Up).
"""

class DependencyRoyaltyRouter:
    @staticmethod
    def calculate_split(base_b2b_fee: float, has_parent_dependency: bool = False, assistant_share_pct: float = 20.0) -> dict:
        # 1. B2B Tax Gross-Up (Налог платит корпорация)
        corporate_tax_rate = 0.20 # 20% накидываем сверху для клиник
        total_invoice_to_clinic = base_b2b_fee * (1 + corporate_tax_rate)
        
        # 2. Базовые отчисления платформы (30%)
        infra_fund = base_b2b_fee * 0.20    # 20% сети
        founder_fund = base_b2b_fee * 0.10  # 10% создателю
        
        # 3. Распределение Аманата Авторов (70%)
        total_author_pool = base_b2b_fee * 0.70
        
        main_author_payout = total_author_pool
        assistant_payout = 0.0
        
        # Индексы репутации (Git-Impact Score)
        main_author_reputation_points = 70.0
        assistant_reputation_points = 0.0

        if has_parent_dependency:
            # Если есть помощники/соавторы
            assistant_payout = base_b2b_fee * (assistant_share_pct / 100.0)
            main_author_payout = total_author_pool - assistant_payout
            
            # Репутация делится пропорционально деньгам (Математическая справедливость)
            assistant_reputation_points = assistant_share_pct
            main_author_reputation_points = 70.0 - assistant_share_pct

        return {
            "b2b_invoice_total": round(total_invoice_to_clinic, 2),
            "taxes_paid_by_clinic": round(base_b2b_fee * corporate_tax_rate, 2),
            "payouts_usdt": {
                "main_author_clean": round(main_author_payout, 2),
                "assistants_clean": round(assistant_payout, 2),
                "infrastructure": round(infra_fund, 2),
                "founder": round(founder_fund, 2)
            },
            "reputation_srs_points_awarded": {
                "main_author_points": round(main_author_reputation_points, 1),
                "assistants_points": round(assistant_reputation_points, 1)
            },
            "legal_status": "TAX_BURDEN_SHIFTED_TO_B2B_BUYER"
        }"""
GitScience™ Fortress: Amanat Royalty Router
Модуль справедливого распределения роялти (70/20/10 или 50/20/30) и репутации (GIS).
Сдвигает налоговое бремя на B2B покупателя (Tax Gross-Up).
"""

class DependencyRoyaltyRouter:
    @staticmethod
    def calculate_split(base_b2b_fee: float, has_parent_dependency: bool = False, assistant_share_pct: float = 20.0) -> dict:
        # 1. B2B Tax Gross-Up (Налог платит корпорация)
        corporate_tax_rate = 0.20 # 20% накидываем сверху для клиник
        total_invoice_to_clinic = base_b2b_fee * (1 + corporate_tax_rate)
        
        # 2. Базовые отчисления платформы (30%)
        infra_fund = base_b2b_fee * 0.20    # 20% сети
        founder_fund = base_b2b_fee * 0.10  # 10% создателю
        
        # 3. Распределение Аманата Авторов (70%)
        total_author_pool = base_b2b_fee * 0.70
        
        main_author_payout = total_author_pool
        assistant_payout = 0.0
        
        # Индексы репутации (Git-Impact Score)
        main_author_reputation_points = 70.0
        assistant_reputation_points = 0.0

        if has_parent_dependency:
            # Если есть помощники/соавторы
            assistant_payout = base_b2b_fee * (assistant_share_pct / 100.0)
            main_author_payout = total_author_pool - assistant_payout
            
            # Репутация делится пропорционально деньгам (Математическая справедливость)
            assistant_reputation_points = assistant_share_pct
            main_author_reputation_points = 70.0 - assistant_share_pct

        return {
            "b2b_invoice_total": round(total_invoice_to_clinic, 2),
            "taxes_paid_by_clinic": round(base_b2b_fee * corporate_tax_rate, 2),
            "payouts_usdt": {
                "main_author_clean": round(main_author_payout, 2),
                "assistants_clean": round(assistant_payout, 2),
                "infrastructure": round(infra_fund, 2),
                "founder": round(founder_fund, 2)
            },
            "reputation_srs_points_awarded": {
                "main_author_points": round(main_author_reputation_points, 1),
                "assistants_points": round(assistant_reputation_points, 1)
            },
            "legal_status": "TAX_BURDEN_SHIFTED_TO_B2B_BUYER"
        }