package com.keiaa.wshly.controller;

import com.keiaa.wshly.model.Card;
import com.keiaa.wshly.model.enums.MainMessage;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class CardController {

    @GetMapping("/")
    public String home(@RequestParam(defaultValue = "1") String f, Model model) {
        model.addAttribute("messages", MainMessage.values());
        model.addAttribute("showForm", f.equals("1"));
        return "index";
    }

    @GetMapping("/card")
    public String showCard(
            @RequestParam(defaultValue = "") String senderName,
            @RequestParam(defaultValue = "") String recipientName,
            @RequestParam(defaultValue = "MERRY_CHRISTMAS") MainMessage mainMessage,
            @RequestParam(defaultValue = "") String customMessage,
            @RequestParam(defaultValue = "0") String f,
            Model model) {
        
        Card card = new Card(senderName, recipientName, mainMessage, customMessage);
        model.addAttribute("card", card);
        model.addAttribute("messages", MainMessage.values());
        model.addAttribute("showForm", f.equals("1"));
        return "index";
    }

    @GetMapping("/api/card/preview")
    @ResponseBody
    public Card getCardPreview(
            @RequestParam(defaultValue = "") String senderName,
            @RequestParam(defaultValue = "") String recipientName,
            @RequestParam(defaultValue = "MERRY_CHRISTMAS") MainMessage mainMessage,
            @RequestParam(defaultValue = "") String customMessage) {
        
        return new Card(senderName, recipientName, mainMessage, customMessage);
    }
}
