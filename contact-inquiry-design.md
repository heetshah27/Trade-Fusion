# Trade Fusion Contact Inquiry Flow

## Objective

Offer public visitors a polished contact form without exposing the owner’s WhatsApp number in page content, browser markup, client JavaScript, or a direct messaging URL.

## Current Delivery Path

The public Contact section submits `name`, `email`, and `message` to a public, server-validated tRPC mutation. Each inquiry is persisted in PostgreSQL and generates an owner notification through the configured private notification service. The number is not collected, rendered, or required for this path.

## Validation and Abuse Boundary

The server accepts a trimmed name of 2–80 characters, a valid email up to 320 characters, and a message of 10–2,000 characters. A hidden honeypot field rejects automated submissions, while a small in-memory IP-window limiter protects against basic burst abuse without storing visitor IP addresses in the database. Failed owner notifications do not discard a persisted inquiry.

## Owner Access

Only the configured project owner can query stored inquiries through the protected router. Anonymous visitors can create inquiries but cannot list, inspect, or alter any saved inquiry.

## WhatsApp Boundary

A direct `wa.me` link would expose the number to every visitor. If WhatsApp delivery is later required, it must use a server-side provider such as Meta WhatsApp Cloud API or Twilio with the destination number and provider credentials stored as server secrets. This needs an explicit provider selection and secure credential configuration from the owner.
