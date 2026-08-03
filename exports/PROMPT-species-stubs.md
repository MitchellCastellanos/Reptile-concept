# Prompt ChatGPT — 11 espèces stub (une seule fois)

Copia **todo** el bloque PROMPT a ChatGPT Premium. Pega la respuesta completa aquí en el chat con Mitch — él importará las fichas a la base de datos.

Estas 11 especies quedaron con nombre stub al vincular animales; usa el **nombre científico corregido** en cada bloque (no el stub de la columna «en DB»).

---

## Las 11 especies

| # | En DB (stub) | Nombre científico correcto | Categoría |
|---|--------------|---------------------------|-----------|
| 1 | Couple | **Oophaga pumilio** | rana dart ( pareja «Paru» ) |
| 2 | Jumping spider | **Phidippus audax** | araña saltadora |
| 3 | Leachieanus bb | **Rhacodactylus leachianus** | gecko leachianus |
| 4 | Madagascar spiny | **Oplurus cuvieri** | iguana cola espinosada |
| 5 | Mante religieuse | **Mantis religiosa** | mantis |
| 6 | Marginated tortoise | **Testudo marginata** | tortuga marginata |
| 7 | P. Spinicornis 15+ | **Porcellio spinicornis** | isópodo (no serpiente) |
| 8 | Pool mix color | **Dendrobates tinctorius** | rana dart |
| 9 | Thamnophis cyrtopsis ocellatus | **Thamnophis cyrtopsis** | serpiente jarretera |
| 10 | Tinctorius yellow | **Dendrobates tinctorius** | rana dart yellow-back |
| 11 | Tliltocatl kahlenbetgi | **Tliltocatl kahlenbergi** | tarántula (corrige typo) |

---

## PROMPT (copiar desde aquí)

Eres un experto bilingüe (francés/inglés) en herpetocultura. Escribes fichas de cuidado para Reptile Concept, tienda en Lachine QC, Canadá.

Genera **exactamente 11 bloques**, uno por especie, en el orden de la lista. Entre bloques pon una línea que diga solo: `---NEXT_SPECIES---`

Para **cada** especie usa este formato (sin markdown, sin comillas, sin código):

```
SPECIES: <nombre científico exacto de la lista>
COMMON_EN: ...
COMMON_FR: ...
EXPERIENCE: beginner|intermediate|advanced
DESCRIPTION_EN: ...
DESCRIPTION_FR: ...
ADULT_SIZE_EN: ...
ADULT_SIZE_FR: ...
LIFESPAN_EN: ...
LIFESPAN_FR: ...
TEMPERAMENT_EN: ...
TEMPERAMENT_FR: ...
DIET_EN: ...
DIET_FR: ...
HUMIDITY: ...
TEMP_DAY: ...
TEMP_NIGHT: ...
UVB_NEEDS: ...
ENCLOSURE_MIN_SIZE: ...
SUBSTRATE: ...
FEEDING_FREQUENCY: ...
HANDLING_EN: ...
HANDLING_FR: ...
```

### Lista (orden obligatorio)

1. Oophaga pumilio
2. Phidippus audax
3. Rhacodactylus leachianus
4. Oplurus cuvieri
5. Mantis religiosa
6. Testudo marginata
7. Porcellio spinicornis
8. Dendrobates tinctorius  (nota: listing «Pool mix color» — ficha para D. tinctorius genérico)
9. Thamnophis cyrtopsis
10. Dendrobates tinctorius  (nota: morph «Yellow Back» — misma especie, enfatiza morph yellow-back en descripción)
11. Tliltocatl kahlenbergi

### Reglas

- Francés en campos `*_FR`, inglés en `*_EN`.
- `EXPERIENCE` solo: beginner, intermediate o advanced.
- Descripciones: 2–4 frases, tono tienda, aficionados responsables.
- Temperaturas en °C, humedad en %, tamaños en cm.
- Porcellio spinicornis = isópodo terrario, no reptil — dieta/humedad acordes.
- Mantis religiosa e Phidippus = invertebrados, no UVB de reptil salvo que no aplique.
- No omitas ningún campo. No agregues comentarios fuera de los bloques.

Confirma al final cuántos bloques generaste (debe ser 11).

## FIN DEL PROMPT

---

## Después

Pega la respuesta de ChatGPT en el chat con Mitch. Él ejecutará el import one-time a Neon.

Para especies **nuevas** en adelante: `/admin/species/new` + helper ChatGPT del sitio (una por una).
