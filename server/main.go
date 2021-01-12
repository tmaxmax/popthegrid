package main

import (
	"log"
	"time"

	"github.com/Pallinder/go-randomdata"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func main() {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		log.Println(c.Hostname())
		return c.Next()
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "popthegrid.com, www.popthegrid.com",
	}))

	app.Use("/", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/", websocket.New(func(c *websocket.Conn) {
		for {
			if err := c.WriteJSON(map[string]interface{}{
				"name": randomdata.SillyName(),
			}); err != nil {
				log.Println("Write:", err)
				break
			}
			time.Sleep(time.Second * 2)
		}
	}))

	log.Fatalln(app.Listen(":8081"))
}
