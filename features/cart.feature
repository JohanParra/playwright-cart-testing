# language: es

Característica: Gestión del Carrito de Compras
  Como cliente
  Quiero gestionar mi carrito de compras
  Para poder comprar productos

  Antecedentes:
    Dado que la base de datos del carrito está vacía

  Escenario: Usuario agrega un producto al carrito y se guarda en la base de datos
    Dado el usuario está en la lista de productos
    Cuando hace clic en "Agregar al carrito" sobre "Blue Top"
    Entonces el carrito debe mostrar 1 producto
    Y el total debe ser 500
    Y el producto "Blue Top" debe existir en la base de datos

  Escenario: Usuario actualiza la cantidad y se refleja en la base de datos
    Dado el carrito contiene 1 "Blue Top"
    Cuando el usuario cambia la cantidad a 3
    Entonces el total del carrito debe ser 1500
    Y la base de datos debe reflejar cantidad = 3 para "Blue Top"

  Escenario: Usuario elimina un producto y se elimina de la base de datos
    Dado el carrito contiene 1 "Stylish Dress"
    Cuando el usuario elimina el producto
    Entonces el carrito debe mostrar el mensaje "Tu carrito está vacío"
    Y la base de datos no debe contener "Stylish Dress"

  Escenario: Usuario agrega varios productos y valida el total
    Dado el usuario está en la lista de productos
    Cuando hace clic en "Agregar al carrito" sobre "Stylish Dress"
    Y hace clic en "Continue Shopping"
    Y hace clic en "Agregar al carrito" sobre "Men Tshirt"
    Entonces el carrito debe mostrar 2 productos
    Y el total debe ser 1900
    Y el producto "Stylish Dress" debe existir en la base de datos
    Y el producto "Men Tshirt" debe existir en la base de datos