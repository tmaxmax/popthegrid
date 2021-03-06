package main

import (
	"crypto/tls"
	"log"
	"time"

	"github.com/Pallinder/go-randomdata"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func main() {
	log.Fatalln(getApp(nil)(":http"))
}

func getApp(cfg *tls.Config) func(string) error {
	app := fiber.New(fiber.Config{
		ReadTimeout:  1 * time.Second,
		WriteTimeout: 1 * time.Second,
		IdleTimeout:  30 * time.Second,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "popthegrid.com, www.popthegrid.com, test.popthegrid.com",
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

	return func(addr string) error {
		return app.Listen(addr)
	}
}
