import re
from datetime import datetime, timedelta
from typing import List, Optional
import math
    # Made by Claude to save time
    # I gave it a list of VCC methodologies from best to worst and this is what it made after a few iterations.


def score_vcs_project(row: List) -> float:
    """
    Score a VCS project based on methodology quality, project characteristics, and other factors.
    
    Args:
        row: A list representing a CSV row with columns:
             [ID, Name, Proponent, Project Type, AFOLU Activities, Methodology, 
              Status, Country/Area, Estimated Annual Emission Reductions, Region, 
              Project Registration Date, Crediting Period Start Date, Crediting Period End Date]
    
    Returns:
        float: Score out of 100 (higher is better quality)
    """
    
    # Expected CSV column indices
    # 0: ID, 1: Name, 2: Proponent, 3: Project Type, 4: AFOLU Activities, 5: Methodology,
    # 6: Status, 7: Country/Area, 8: Estimated Annual Emission Reductions, 9: Region,
    # 10: Project Registration Date, 11: Crediting Period Start Date, 12: Crediting Period End Date
    
    # Helper function to safely get values from the row
    def get_value(index: int) -> str:
        return row[index] if index < len(row) and row[index] is not None else ''
    
    total_score = 0.0
    
    # =================
    # 1. METHODOLOGY QUALITY SCORE (50 points - most important factor)
    # =================
    methodology = get_value(5)  # Index 5: Methodology
    methodology_score = score_methodology(methodology)
    total_score += methodology_score * 0.5  # 50% weight
    
    # =================
    # 2. PROJECT SIZE/SCALE SCORE (15 points)
    # =================
    emissions = get_value(8)  # Index 8: Estimated Annual Emission Reductions
    size_score = score_project_size(emissions)
    total_score += size_score * 0.15  # 15% weight
    
    # =================
    # 3. PROJECT STATUS SCORE (10 points)
    # =================
    status = get_value(6)  # Index 6: Status
    status_score = score_project_status(status)
    total_score += status_score * 0.1  # 10% weight
    
    # =================
    # 4. PROJECT AGE/VINTAGE SCORE (10 points)
    # =================
    reg_date = get_value(10)  # Index 10: Project Registration Date
    start_date = get_value(11)  # Index 11: Crediting Period Start Date
    vintage_score = score_project_vintage(reg_date, start_date)
    total_score += vintage_score * 0.1  # 10% weight
    
    # =================
    # 5. PROJECT TYPE SCORE (8 points)
    # =================
    project_type = get_value(3)  # Index 3: Project Type
    type_score = score_project_type(project_type)
    total_score += type_score * 0.08  # 8% weight
    
    # =================
    # 6. GEOGRAPHIC RISK SCORE (4 points)
    # =================
    country = get_value(7)  # Index 7: Country/Area
    region = get_value(9)   # Index 9: Region
    geo_score = score_geographic_risk(country, region)
    total_score += geo_score * 0.04  # 4% weight
    
    # =================
    # 7. CREDITING PERIOD LENGTH SCORE (3 points)
    # =================
    start_date = get_value(11)  # Index 11: Crediting Period Start Date
    end_date = get_value(12)    # Index 12: Crediting Period End Date
    period_score = score_crediting_period(start_date, end_date)
    total_score += period_score * 0.03  # 3% weight
    
    return min(100.0, max(0.0, total_score))


def score_methodology(methodology: str) -> float:
    """Score methodology quality based on research and ICVCM approvals (0-100)"""
    if not methodology:
        return 20.0  # Default low score for missing methodology
    
    methodology = methodology.upper()
    
    # Tier 1: Highest Quality (85-100 points)
    if 'VM0044' in methodology:  # Biochar - ICVCM approved
        return 95.0
    if 'VM0050' in methodology:  # Cookstoves new methodology - ICVCM approved
        return 90.0
    
    # Renewable Energy methodologies (high quality)
    renewable_patterns = ['AMS-I.D', 'AMS-I.F', 'ACM0002', 'AM0019', 'AM0026']
    if any(pattern in methodology for pattern in renewable_patterns):
        return 85.0
    
    # Tier 2: Good Quality (70-84 points)
    # Industrial gas destruction
    if any(pattern in methodology for pattern in ['AM0001', 'AM0023', 'ACM0016']):
        return 80.0
    
    # Waste management
    waste_patterns = ['AMS-III.D', 'AMS-III.E', 'AMS-III.F', 'ACM0022']
    if any(pattern in methodology for pattern in waste_patterns):
        return 75.0
    
    # Energy efficiency
    if 'VM0008' in methodology or 'AMS-II' in methodology:
        return 72.0
    
    # Tier 3: Moderate Quality (50-69 points)
    # Transport
    transport_patterns = ['AMS-III.C', 'AM0031', 'ACM0016']
    if any(pattern in methodology for pattern in transport_patterns):
        return 65.0
    
    # Agriculture (non-REDD+)
    if 'VM0042' in methodology:  # Agricultural Land Management
        return 60.0
    
    # Cookstoves (older methodologies)
    if any(pattern in methodology for pattern in ['VMR0006', 'VMR0011', 'AMS-I.E', 'AMS-II.G']):
        return 55.0
    
    # Tier 4: Concerning Quality (25-49 points)
    # Improved Forest Management
    ifm_patterns = ['VM0003', 'VM0010', 'VM0012']
    if any(pattern in methodology for pattern in ifm_patterns):
        return 40.0
    
    # Afforestation/Reforestation
    arr_patterns = ['AR-ACM', 'AR-AMS', 'VM0005']
    if any(pattern in methodology for pattern in arr_patterns):
        return 35.0
    
    # Avoided deforestation (non-REDD+ framework)
    if 'VM0015' in methodology:
        return 30.0
    
    # Tier 5: Lowest Quality (5-24 points)
    # REDD+ methodologies - extensively documented problems
    redd_patterns = ['VM0007', 'VM0006', 'VM0048']
    if any(pattern in methodology for pattern in redd_patterns):
        return 15.0
    
    # Multiple methodologies - often indicates complexity/lower quality
    if ';' in methodology and len(methodology.split(';')) > 2:
        return 25.0
    
    # Default for unknown methodologies
    return 45.0


def score_project_size(emissions_str: str) -> float:
    """Score based on project size - larger projects often have better economics (0-100)"""
    if not emissions_str:
        return 50.0  # Default score
    
    try:
        # Clean and parse emission reductions
        if isinstance(emissions_str, str):
            emissions = float(emissions_str.replace(',', ''))
        else:
            emissions = float(emissions_str)
    except (ValueError, TypeError):
        return 50.0
    
    # Score based on emission reduction scale (tCO2e/year)
    if emissions >= 1000000:  # >= 1M tCO2e/year
        return 95.0
    elif emissions >= 500000:  # 500k-1M
        return 85.0
    elif emissions >= 100000:  # 100k-500k
        return 75.0
    elif emissions >= 50000:   # 50k-100k
        return 65.0
    elif emissions >= 10000:   # 10k-50k
        return 55.0
    elif emissions >= 1000:    # 1k-10k
        return 45.0
    else:  # < 1k
        return 35.0


def score_project_status(status: str) -> float:
    """Score based on project status (0-100)"""
    if not status:
        return 50.0
    
    status = status.lower()
    
    # Registered and active projects score highest
    if 'registered' in status and 'inactive' not in status:
        return 90.0
    elif 'under validation' in status:
        return 60.0  # Future potential but unproven
    elif 'under verification' in status:
        return 75.0
    elif 'inactive' in status or 'withdrawn' in status:
        return 20.0
    elif 'rejected' in status:
        return 10.0
    else:
        return 50.0  # Unknown status


def score_project_vintage(reg_date: str, start_date: str) -> float:
    """Score based on project vintage - newer projects often have better methodologies (0-100)"""
    
    def parse_date(date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except:
            try:
                return datetime.strptime(date_str, '%m/%d/%Y')
            except:
                return None
    
    # Use registration date if available, otherwise start date
    project_date = parse_date(reg_date) or parse_date(start_date)
    
    if not project_date:
        return 50.0  # Default for missing dates
    
    current_date = datetime.now()
    years_ago = (current_date - project_date).days / 365.25
    
    # Newer projects score higher (better methodologies, standards)
    if years_ago <= 1:
        return 95.0
    elif years_ago <= 3:
        return 85.0
    elif years_ago <= 5:
        return 75.0
    elif years_ago <= 8:
        return 65.0
    elif years_ago <= 12:
        return 50.0
    else:
        return 35.0  # Very old projects


def score_project_type(project_type: str) -> float:
    """Score based on project type reliability (0-100)"""
    if not project_type:
        return 50.0
    
    project_type = project_type.lower()
    
    # Renewable energy - most reliable
    if 'renewable' in project_type or 'energy industries' in project_type:
        return 90.0
    
    # Waste management - generally reliable
    if 'waste' in project_type:
        return 80.0
    
    # Industrial processes
    if 'chemical' in project_type or 'manufacturing' in project_type:
        return 75.0
    
    # Transport
    if 'transport' in project_type:
        return 70.0
    
    # Agriculture (non-AFOLU)
    if 'agriculture' in project_type and 'forestry' not in project_type:
        return 60.0
    
    # AFOLU (highly variable quality)
    if 'afolu' in project_type or 'forestry' in project_type:
        return 40.0
    
    # Fugitive emissions
    if 'fugitive' in project_type:
        return 65.0
    
    return 55.0  # Default


def score_geographic_risk(country: str, region: str) -> float:
    """Score based on geographic and governance risk (0-100)"""
    if not country and not region:
        return 50.0
    
    # High governance/low risk countries
    high_quality_countries = [
        'germany', 'switzerland', 'norway', 'denmark', 'sweden', 'finland',
        'netherlands', 'canada', 'australia', 'new zealand', 'japan',
        'singapore', 'united kingdom', 'france', 'austria', 'belgium'
    ]
    
    # Medium risk countries  
    medium_risk_countries = [
        'united states', 'south korea', 'israel', 'chile', 'uruguay',
        'costa rica', 'poland', 'czech republic', 'estonia', 'spain',
        'portugal', 'italy', 'greece', 'turkey', 'mexico', 'china'
    ]
    
    country_lower = (country or '').lower()
    
    if any(c in country_lower for c in high_quality_countries):
        return 85.0
    elif any(c in country_lower for c in medium_risk_countries):
        return 65.0
    else:
        # Use region as fallback
        region_lower = (region or '').lower()
        if 'europe' in region_lower:
            return 75.0
        elif 'north america' in region_lower:
            return 70.0
        elif 'asia' in region_lower:
            return 55.0
        elif 'latin america' in region_lower:
            return 50.0
        elif 'africa' in region_lower:
            return 45.0
        else:
            return 50.0


def score_crediting_period(start_date: str, end_date: str) -> float:
    """Score based on crediting period length - longer periods have permanence risks (0-100)"""
    
    def parse_date(date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except:
            try:
                return datetime.strptime(date_str, '%m/%d/%Y')
            except:
                return None
    
    start = parse_date(start_date)
    end = parse_date(end_date)
    
    if not start or not end:
        return 70.0  # Default score
    
    years = (end - start).days / 365.25
    
    # Optimal period is 7-10 years
    if 7 <= years <= 10:
        return 90.0
    elif 5 <= years <= 15:
        return 80.0
    elif 3 <= years <= 20:
        return 70.0
    elif years > 20:
        return 50.0  # Very long periods have permanence risks
    else:
        return 60.0  # Very short periods
if __name__ == "__main__":
    # Test with sample data - format matches your ID_row_dict values
    sample_projects = [
        # High quality biochar project
        [1, "Test Biochar", "Company A", "Waste handling and disposal", "", "VM0044", 
         "Registered", "Germany", "50,000", "Europe", "2023-01-01", "2023-01-01", "2030-01-01"],
        
        # REDD+ project (low quality)
        [2, "Forest Protection", "Company B", "Agriculture Forestry and Other Land Use", "ARR", 
         "VM0007", "Registered", "Brazil", "2,000,000", "Latin America", "2015-01-01", "2015-01-01", "2035-01-01"],
        
        # Renewable energy project  
        [3, "Solar Farm", "Company C", "Energy industries (renewable/non-renewable sources)", "",
         "AMS-I.D", "Registered", "India", "100,000", "Asia", "2022-01-01", "2022-01-01", "2029-01-01"],
    ]
    
    print("Sample Project Scores:")
    for i, project_row in enumerate(sample_projects, 1):
        score = score_vcs_project(project_row)
        print(f"Project {i}: {score:.1f}/100")
        print(f"  Methodology: {project_row[5]}")
        print(f"  Type: {project_row[3]}")
        print(f"  Country: {project_row[7]}")
        print(f"  Emissions: {project_row[8]}")
        print()
        
    # Example of how to use with your ID_row_dict structure:
    print("Example usage with ID_row_dict:")
    print("# Assuming you have ID_row_dict populated from your CSV parsing")
    print("# project_id = 1234")
    print("# row = ID_row_dict[project_id]")
    print("# score = score_vcs_project(row)")
    print("# print(f'Project {project_id} score: {score:.1f}/100')")
