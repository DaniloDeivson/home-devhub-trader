#!/usr/bin/env python3
"""
Script para corrigir os dois locais onde "N/A" está sendo usado para dias vencedores/perdedores
"""
import re

def fix_dias_vencedores():
    """Corrigir os dois locais onde 'N/A' está sendo usado"""
    
    # Ler o arquivo
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Substituir as duas ocorrências
    pattern = r'"dias_vencedores_perdedores": "N/A",  # Não disponível no FunCalculos\.py"'
    replacement = '"dias_vencedores_perdedores": f"{performance_metrics.get(\'Winning Days\', 0)} / {performance_metrics.get(\'Losing Days\', 0)}",'
    
    # Fazer a substituição
    new_content = re.sub(pattern, replacement, content)
    
    # Verificar se houve mudanças
    if new_content != content:
        # Salvar o arquivo
        with open('main.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ Corrigidos os dois locais onde 'N/A' estava sendo usado")
        print("📊 Agora dias vencedores/perdedores serão calculados corretamente")
    else:
        print("❌ Nenhuma mudança foi feita - verificar se o padrão está correto")
        print("🔍 Padrão usado:", pattern)
        print("🔍 Ocorrências encontradas:", len(re.findall(pattern, content)))

if __name__ == "__main__":
    fix_dias_vencedores() 