<?php

namespace Oro\Bundle\FormBundle\Model;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;

use Oro\Bundle\EntityBundle\ORM\DoctrineHelper;
use Oro\Bundle\UIBundle\Route\Router;

class UpdateHandler
{
    /**
     * @var Request
     */
    protected $request;

    /**
     * @var Session
     */
    protected $session;

    /**
     * @var Router
     */
    protected $router;

    /**
     * @var DoctrineHelper
     */
    protected $doctrineHelper;

    /**
     * @param Request $request
     * @param Session $session
     * @param Router $router
     * @param DoctrineHelper $doctrineHelper
     */
    public function __construct(Request $request, Session $session, Router $router, DoctrineHelper $doctrineHelper)
    {
        $this->request = $request;
        $this->session = $session;
        $this->router = $router;
        $this->doctrineHelper = $doctrineHelper;
    }

    /**
     * @param object $entity
     * @param FormInterface $form
     * @param array $saveAndStayRoute
     * @param array $saveAndCloseRoute
     * @param string $saveMessage
     * @param null $formHandler
     * @return array|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function handleUpdate(
        $entity,
        FormInterface $form,
        array $saveAndStayRoute,
        array $saveAndCloseRoute,
        $saveMessage,
        $formHandler = null
    ) {
        if ($formHandler) {
            if (method_exists($formHandler, 'process') && $formHandler->process($entity)) {
                return $this->processSave($form, $entity, $saveAndStayRoute, $saveAndCloseRoute, $saveMessage);
            }
        } elseif ($this->saveForm($form, $entity)) {
            return $this->processSave($form, $entity, $saveAndStayRoute, $saveAndCloseRoute, $saveMessage);
        }

        return array(
            'entity' => $entity,
            'form'   => $form->createView(),
        );
    }

    /**
     * @param FormInterface $form
     * @param object $entity
     * @return bool
     */
    protected function saveForm(FormInterface $form, $entity)
    {
        $form->setData($entity);

        if (in_array($this->request->getMethod(), array('POST', 'PUT'))) {
            $form->submit($this->request);

            if ($form->isValid()) {
                $manager = $this->doctrineHelper->getEntityManager($entity);
                $manager->persist($entity);
                $manager->flush();

                return true;
            }
        }

        return false;
    }

    /**
     * @param FormInterface $form
     * @param object $entity
     * @param array $saveAndStayRoute
     * @param array $saveAndCloseRoute
     * @param string $saveMessage
     * @return array|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    protected function processSave(
        FormInterface $form,
        $entity,
        array $saveAndStayRoute,
        array $saveAndCloseRoute,
        $saveMessage
    ) {
        if ($this->request->get('_wid')) {
            return array(
                'form'   => $form->createView(),
                'entity' => $entity,
                'savedId' => $this->doctrineHelper->getSingleEntityIdentifier($entity)
            );
        } else {
            $this->session->getFlashBag()->add('success', $saveMessage);
            return $this->router->redirectAfterSave($saveAndStayRoute, $saveAndCloseRoute, $entity);
        }
    }
}
